import type { GrpcServiceDescriptor } from '@beak/common/ipc/grpc';
import { projectTree } from '@beak/state';
import type { GrpcDescriptor } from '@beak/state/schemas';
import Button from '@beak/ui/components/atoms/Button';
import Dialog, { DialogBody, DialogFooter, DialogHeader } from '@beak/ui/components/molecules/Dialog';
import { changeTab } from '@beak/ui/features/tabs/store/actions';
import { glassChakraProps } from '@beak/ui/lib/glass';
import { ipcGrpcService } from '@beak/ui/lib/ipc';
import { discoverGrpcMethods } from '@beak/ui/services/source-schemas/discover';
import { syncOpenApiFromSource } from '@beak/ui/services/source-schemas/sync-openapi';
import { alertInsert, alertRemove } from '@beak/ui/store/project/actions';
import { endpointSyncFailedIdent } from '@beak/ui/store/project/types';
import { useAppSelector } from '@beak/ui/store/redux';
import { Box, chakra, Flex, Menu, Portal, Wrap } from '@chakra-ui/react';
import { motion } from 'framer-motion';
import {
	AlertCircle,
	AlertOctagon,
	CheckCircle2,
	ChevronDown,
	Circle,
	FileText,
	Hash,
	MoreHorizontal,
	Network,
	Pencil,
	Play,
	Plug,
	Plus,
	RefreshCw,
	Trash2,
} from 'lucide-react';
import * as React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { useDispatch } from 'react-redux';

import { syncFromUrl } from '../../project-home/lib/sync-from-url';
import SidebarPane from '../../sidebar/components/SidebarPane';
import { useSourceSchemas } from '../hooks/use-source-schemas';
import {
	deleteSourceSchemaFolder,
	type PersistedGrpcDescriptor,
	readGrpcDescriptor,
	syncGrpcMethodRequestFiles,
	writeGrpcDescriptor,
} from '../lib/persist';
import { describeSync } from '../lib/sync-status';
import { actions as sourceSchemasUiActions } from '../store';
import { type OpenApiSource, SOURCE_SCHEMA_CONFIG, type SourceSchemaEntry, type SourceSchemaKind } from '../types';
import GrpcInvokeDialog from './GrpcInvokeDialog';
import SourceSchemaDialog from './SourceSchemaDialog';

const ChakraButton = chakra('button');

type DialogState =
	| { mode: 'closed' }
	| { mode: 'create'; kind: SourceSchemaKind }
	| { mode: 'edit'; kind: SourceSchemaKind; entry: SourceSchemaEntry }
	| { mode: 'confirm-delete'; kind: SourceSchemaKind; entry: SourceSchemaEntry }
	| {
			mode: 'grpc-invoke';
			entry: SourceSchemaEntry;
			descriptor: GrpcDescriptor;
			services: GrpcServiceDescriptor[];
	  };

interface UnifiedRow {
	kind: SourceSchemaKind;
	entry: SourceSchemaEntry;
}

/**
 * Unified "Endpoints" sidebar pane. Lists every graphql + grpc-source
 * collection in one table — both kinds share the same registry shape,
 * so combining them is honest and avoids tab-switching.
 *
 * The header carries a single Add dropdown that picks the kind first,
 * then opens the dialog. Each row tags its kind with a coloured chip
 * (indigo for GraphQL, teal for gRPC) so the user can scan the table
 * without parsing the URL.
 */
const SourceSchemasPane: React.FC = () => {
	const graphql = useSourceSchemas('graphql');
	const grpc = useSourceSchemas('grpc');
	const openapi = useSourceSchemas('openapi');
	const tree = useAppSelector(s => s.global.project.tree);
	// Index endpoint-sync-failed alerts by folder path so each row can read its
	// own current failure (if any) without scanning the whole alerts map.
	const syncFailuresByFolder = useAppSelector(s => {
		const out: Record<string, string> = {};
		for (const alert of Object.values(s.global.project.alerts)) {
			if (!alert || alert.type !== 'endpoint_sync_failed') continue;
			out[alert.scope.folderPath] = alert.payload.errorMessage;
		}
		return out;
	});
	const [dialog, setDialog] = useState<DialogState>({ mode: 'closed' });
	const dispatch = useDispatch();
	const pendingSourceKind = useAppSelector(s => s.features.sourceSchemasUi.pendingSourceKind);

	// Honour the "open the dialog for this kind" intent posted by the
	// welcome screen's schema-source tiles. Fires once per intent — we clear
	// it on consume so re-mounts don't re-open the dialog.
	useEffect(() => {
		if (!pendingSourceKind) return;
		setDialog({ mode: 'create', kind: pendingSourceKind });
		dispatch(sourceSchemasUiActions.clearPendingSchemaSource());
	}, [pendingSourceKind, dispatch]);

	function refreshLists() {
		void graphql.refresh();
		void grpc.refresh();
		void openapi.refresh();
	}

	function closeDialog(didChange: boolean) {
		setDialog({ mode: 'closed' });
		if (didChange) refreshLists();
	}

	/**
	 * Open the first request inside an endpoint folder — used by the
	 * GraphQL edit dialog's "Open introspection request" button. The persist
	 * layer seeds `Discover schema.json` for GraphQL, so the first child of
	 * a graphql folder is always the introspection request.
	 */
	function openSeedRequest(folderPath: string) {
		const folder = projectTree.findFolderByPath(tree, folderPath);
		if (!folder) return;
		const seed = projectTree.findChildren(tree, folder.id, 'request').sort((a, b) => a.name.localeCompare(b.name))[0];
		if (seed) dispatch(changeTab({ type: 'request', payload: seed.id, temporary: false }));
	}

	/**
	 * Re-open the try-it dialog using descriptors persisted on the last
	 * discovery run. Avoids a fresh network roundtrip when the user just
	 * wants to fire another request against an already-discovered service.
	 */
	async function openInvokeDialog(entry: SourceSchemaEntry) {
		if (!('descriptor' in entry.source) || !entry.source.descriptor) return;
		const persisted = await readGrpcDescriptor(entry.folderPath);
		if (!persisted) {
			// No sidecar yet — run discovery first; the success path drops
			// the user into the dialog automatically.
			await runDiscover(entry);
			return;
		}
		setDialog({
			mode: 'grpc-invoke',
			entry,
			descriptor: entry.source.descriptor,
			services: persisted.services,
		});
	}

	async function confirmDelete(entry: SourceSchemaEntry) {
		try {
			await deleteSourceSchemaFolder(entry.folderPath);
			refreshLists();
		} catch (e) {
			console.warn('endpoint delete failed', e);
		} finally {
			setDialog({ mode: 'closed' });
		}
	}

	/**
	 * Kick off a gRPC discovery roundtrip for the given endpoint. The actual
	 * IPC + sidecar + method-file orchestration lives in
	 * `services/source-schemas/discover` so this handler only translates the
	 * Result into UI side-effects (alert insert/remove, refresh, drop into
	 * the try-it dialog).
	 */
	async function runDiscover(entry: SourceSchemaEntry) {
		if (entry.source.type !== 'grpc') return;
		const ident = endpointSyncFailedIdent(entry.folderPath);
		const result = await discoverGrpcMethods(
			{ folderPath: entry.folderPath, folderName: entry.folderName, source: entry.source },
			{
				discoverMethods: args => ipcGrpcService.discoverMethods(args),
				writeGrpcDescriptor: (folderPath, payload) => writeGrpcDescriptor(folderPath, payload as PersistedGrpcDescriptor),
				syncGrpcMethodRequestFiles: (folderPath, services) => syncGrpcMethodRequestFiles(folderPath, services),
			},
		);
		if (result.kind === 'skipped') return;
		if (result.kind === 'error') {
			dispatch(
				alertInsert({
					ident,
					alert: {
						type: 'endpoint_sync_failed',
						severity: 'warning',
						scope: { kind: 'endpoint', folderPath: entry.folderPath },
						payload: { folderName: entry.folderName, kind: 'grpc', errorMessage: result.errorMessage },
					},
				}),
			);
			return;
		}
		dispatch(alertRemove(ident));
		refreshLists();
		if (result.services.length > 0) {
			setDialog({ mode: 'grpc-invoke', entry, descriptor: result.descriptor, services: result.services });
		}
	}

	const rows = useMemo<UnifiedRow[]>(() => {
		const all: UnifiedRow[] = [
			...graphql.entries.map(entry => ({ kind: 'graphql' as const, entry })),
			...grpc.entries.map(entry => ({ kind: 'grpc' as const, entry })),
			...openapi.entries.map(entry => ({ kind: 'openapi' as const, entry })),
		];
		all.sort((a, b) => a.entry.relativeFolder.localeCompare(b.entry.relativeFolder));
		return all;
	}, [graphql.entries, grpc.entries, openapi.entries]);

	const loading = graphql.loading || grpc.loading || openapi.loading;
	const hasRows = rows.length > 0;

	/**
	 * Re-fetch the spec for a URL-mode openapi endpoint. The actual sync
	 * logic lives in `services/source-schemas/sync-openapi`; this handler
	 * just translates the Result into the alert + refresh side-effects.
	 */
	async function runOpenApiSync(entry: SourceSchemaEntry) {
		if (entry.source.type !== 'openapi') return;
		const ident = endpointSyncFailedIdent(entry.folderPath);
		const result = await syncOpenApiFromSource(
			{ folderPath: entry.folderPath, folderName: entry.folderName, source: entry.source },
			{ syncFromUrl },
		);
		if (result.kind === 'skipped') return;
		if (result.kind === 'error') {
			dispatch(
				alertInsert({
					ident,
					alert: {
						type: 'endpoint_sync_failed',
						severity: 'warning',
						scope: { kind: 'endpoint', folderPath: entry.folderPath },
						payload: { folderName: entry.folderName, kind: 'openapi', errorMessage: result.errorMessage },
					},
				}),
			);
			return;
		}
		dispatch(alertRemove(ident));
		refreshLists();
	}

	return (
		<React.Fragment>
			<SidebarPane>
				{hasRows && (
					<Flex align='center' justify='space-between' h='24px' px='3' flexShrink={0}>
						<Box fontSize='11px' fontWeight='600' color='fg.muted' letterSpacing='0.04em' textTransform='uppercase'>
							{loading ? 'Loading…' : `${rows.length} registered`}
						</Box>
						<AddDropdown onPick={kind => setDialog({ mode: 'create', kind })} />
					</Flex>
				)}

				<Box flex='1' minH={0} overflowY='auto'>
					{!hasRows && !loading && <EmptyState onPick={kind => setDialog({ mode: 'create', kind })} />}

					{hasRows && (
						<Flex direction='column' py='1'>
							{rows.map(({ kind, entry }) => (
								<SourceSchemaRow
									key={entry.folderPath}
									kind={kind}
									entry={entry}
									syncError={syncFailuresByFolder[entry.folderPath]}
									onEdit={() => setDialog({ mode: 'edit', kind, entry })}
									onDelete={() => setDialog({ mode: 'confirm-delete', kind, entry })}
									onDiscover={kind === 'grpc' ? () => runDiscover(entry) : undefined}
									onInvoke={kind === 'grpc' ? () => openInvokeDialog(entry) : undefined}
									onSync={
										kind === 'openapi' && (entry.source as OpenApiSource).specUrl ? () => runOpenApiSync(entry) : undefined
									}
								/>
							))}
						</Flex>
					)}
				</Box>
			</SidebarPane>

			{dialog.mode === 'create' && (
				<SourceSchemaDialog sourceSchemaKind={dialog.kind} mode={{ kind: 'create' }} onClose={closeDialog} />
			)}
			{dialog.mode === 'edit' &&
				(() => {
					// Read the live entry on every render so the "Last synced" line in
					// the dialog reflects a freshly-run sync without having to re-open.
					const liveEntry = rows.find(r => r.entry.folderPath === dialog.entry.folderPath)?.entry ?? dialog.entry;
					const liveOpenApi = dialog.kind === 'openapi' ? (liveEntry.source as OpenApiSource) : null;
					return (
						<SourceSchemaDialog
							sourceSchemaKind={dialog.kind}
							mode={{
								kind: 'edit',
								folderPath: liveEntry.folderPath,
								folderName: liveEntry.folderName,
							}}
							initialEndpoint={
								'endpoint' in liveEntry.source && typeof liveEntry.source.endpoint === 'string' ? liveEntry.source.endpoint : ''
							}
							initialDescriptor={
								dialog.kind === 'grpc' && 'descriptor' in liveEntry.source ? liveEntry.source.descriptor : undefined
							}
							initialOpenApiSource={liveOpenApi ?? undefined}
							lastSyncedAt={liveEntry.source.lastSyncedAt}
							onSyncNow={
								dialog.kind === 'openapi' && liveOpenApi?.specUrl
									? async () => {
											await runOpenApiSync(liveEntry);
										}
									: undefined
							}
							onOpenIntrospection={
								dialog.kind === 'graphql'
									? () => {
											openSeedRequest(liveEntry.folderPath);
											closeDialog(false);
										}
									: undefined
							}
							onClose={closeDialog}
						/>
					);
				})()}
			{dialog.mode === 'confirm-delete' && (
				<DeleteConfirmDialog
					entry={dialog.entry}
					onCancel={() => setDialog({ mode: 'closed' })}
					onConfirm={() => confirmDelete(dialog.entry)}
				/>
			)}
			{dialog.mode === 'grpc-invoke' && (
				<GrpcInvokeDialog
					endpoint={
						'endpoint' in dialog.entry.source && typeof dialog.entry.source.endpoint === 'string'
							? dialog.entry.source.endpoint
							: ''
					}
					descriptor={dialog.descriptor}
					services={dialog.services}
					onClose={() => setDialog({ mode: 'closed' })}
				/>
			)}
		</React.Fragment>
	);
};

// ─── Add dropdown ─────────────────────────────────────────────────────────

const AddDropdown: React.FC<{ onPick: (kind: SourceSchemaKind) => void }> = ({ onPick }) => (
	<Menu.Root>
		<Menu.Trigger asChild>
			<ChakraButton
				type='button'
				aria-label='Add schema source'
				title='Add schema source'
				display='inline-flex'
				alignItems='center'
				gap='1'
				h='22px'
				px='2'
				borderRadius='sm'
				borderWidth='1px'
				borderColor='border.subtle'
				bg='transparent'
				color='fg.muted'
				fontSize='11px'
				fontWeight='500'
				cursor='pointer'
				transition='border-color .12s ease, background-color .12s ease, color .12s ease'
				_hover={{
					color: 'fg.default',
					bg: 'color-mix(in srgb, var(--beak-colors-fg-default) 8%, transparent)',
				}}
				_focusVisible={{
					outline: 'none',
					borderColor: 'accent.pink',
					boxShadow: '0 0 0 2px color-mix(in srgb, var(--beak-colors-accent-pink) 30%, transparent)',
				}}
				css={{
					'&[data-state="open"]': {
						color: 'var(--beak-colors-fg-default)',
						background: 'color-mix(in srgb, var(--beak-colors-fg-default) 10%, transparent)',
					},
					'&[data-state="open"] svg.lucide-chevron-down': { transform: 'rotate(180deg)' },
					'svg.lucide-chevron-down': { transition: 'transform .16s cubic-bezier(0.16, 1, 0.3, 1)' },
				}}
			>
				<Plus size={11} strokeWidth={2} />
				<Box as='span'>{'Add'}</Box>
				<ChevronDown size={11} strokeWidth={1.8} style={{ opacity: 0.6 }} />
			</ChakraButton>
		</Menu.Trigger>
		<Portal>
			<Menu.Positioner>
				<Menu.Content {...glassChakraProps.menu} borderRadius='md' p='1' minW='220px'>
					<KindMenuItem kind='graphql' onPick={onPick} />
					<KindMenuItem kind='grpc' onPick={onPick} />
					<KindMenuItem kind='openapi' onPick={onPick} />
				</Menu.Content>
			</Menu.Positioner>
		</Portal>
	</Menu.Root>
);

const KIND_ICONS: Record<SourceSchemaKind, typeof Hash> = {
	graphql: Hash,
	grpc: Network,
	openapi: FileText,
};

const KIND_SUBTITLES: Record<SourceSchemaKind, string> = {
	graphql: 'Register a GraphQL endpoint',
	grpc: 'Register a gRPC service',
	openapi: 'Import from a spec file, URL, or paste',
};

const KIND_CHIP_LABEL: Record<SourceSchemaKind, string> = {
	graphql: 'GraphQL',
	grpc: 'gRPC',
	openapi: 'OpenAPI',
};

const KindMenuItem: React.FC<{ kind: SourceSchemaKind; onPick: (kind: SourceSchemaKind) => void }> = ({
	kind,
	onPick,
}) => {
	const config = SOURCE_SCHEMA_CONFIG[kind];
	const Icon = KIND_ICONS[kind];
	return (
		<Menu.Item
			value={kind}
			onClick={() => onPick(kind)}
			fontSize='12px'
			fontWeight='500'
			borderRadius='sm'
			py='1.5'
			px='2'
			gap='2'
			color='fg.default'
			_hover={{
				bg: 'color-mix(in srgb, var(--beak-colors-accent-pink) 12%, transparent)',
				color: 'accent.pink',
			}}
		>
			<Box color={config.accentToken}>
				<Icon size={12} strokeWidth={1.8} />
			</Box>
			<Flex direction='column' align='flex-start' gap='0' minW={0}>
				<Box as='span' fontWeight='600'>
					{config.label}
				</Box>
				<Box as='span' fontSize='10.5px' color='fg.subtle' fontWeight='400'>
					{KIND_SUBTITLES[kind]}
				</Box>
			</Flex>
		</Menu.Item>
	);
};

// ─── Empty state ──────────────────────────────────────────────────────────

/**
 * Empty state mirrors the variable-sets EmptyState vocabulary: big pink
 * icon in a tinted circle, large bold title, soft description, and a row
 * of one-tap buttons (one per kind) rather than a dropdown — there's
 * nothing else on the surface yet, so burying the three choices behind
 * an Add menu would be needless friction.
 */
const EmptyState: React.FC<{ onPick: (kind: SourceSchemaKind) => void }> = ({ onPick }) => (
	<Flex direction='column' align='center' justify='center' gap='3' py='14' px='6'>
		<motion.div
			initial={{ opacity: 0, scale: 0.92 }}
			animate={{ opacity: 1, scale: 1 }}
			transition={{ type: 'spring', stiffness: 600, damping: 28 }}
		>
			<Flex
				align='center'
				justify='center'
				w='56px'
				h='56px'
				borderRadius='full'
				bg='color-mix(in srgb, var(--beak-colors-accent-pink) 16%, transparent)'
				color='accent.pink'
				borderWidth='1px'
				borderColor='color-mix(in srgb, var(--beak-colors-accent-pink) 30%, transparent)'
				boxShadow='0 8px 24px color-mix(in srgb, var(--beak-colors-accent-pink) 30%, transparent), inset 0 1px 0 color-mix(in srgb, white 18%, transparent)'
			>
				<Plug size={22} strokeWidth={1.8} />
			</Flex>
		</motion.div>
		<Box fontSize='xl' fontWeight='700' color='fg.default' letterSpacing='-0.02em' lineHeight='1.1'>
			{'No schema sources yet'}
		</Box>
		<Box fontSize='xs' color='fg.muted' textAlign='center' maxW='360px' lineHeight='1.5'>
			{
				'Schema sources turn an API contract into a folder of requests. Point Beak at a GraphQL endpoint, a gRPC service, or an OpenAPI spec — every operation is imported as a request, grouped under one folder, and (for OpenAPI) kept in sync as the spec evolves.'
			}
		</Box>
		<Wrap gap='2' justify='center' mt='1'>
			<KindButton kind='graphql' onPick={onPick} />
			<KindButton kind='grpc' onPick={onPick} />
			<KindButton kind='openapi' onPick={onPick} />
		</Wrap>
	</Flex>
);

const KIND_BUTTON_LABEL: Record<SourceSchemaKind, string> = {
	graphql: 'GraphQL',
	grpc: 'gRPC',
	openapi: 'OpenAPI',
};

const KindButton: React.FC<{ kind: SourceSchemaKind; onPick: (kind: SourceSchemaKind) => void }> = ({
	kind,
	onPick,
}) => {
	const config = SOURCE_SCHEMA_CONFIG[kind];
	const Icon = KIND_ICONS[kind];
	return (
		<ChakraButton
			type='button'
			onClick={() => onPick(kind)}
			display='inline-flex'
			alignItems='center'
			gap='1.5'
			h='28px'
			px='2.5'
			borderRadius='md'
			borderWidth='1px'
			borderColor='border.default'
			bg='transparent'
			color='fg.default'
			fontSize='xs'
			fontWeight='600'
			cursor='pointer'
			transition='border-color .12s ease, background-color .12s ease, color .12s ease'
			_hover={{
				borderColor: config.accentToken,
				bg: `color-mix(in srgb, ${config.accentVar} 10%, transparent)`,
			}}
			_focusVisible={{
				outline: 'none',
				borderColor: config.accentToken,
				boxShadow: `0 0 0 3px color-mix(in srgb, ${config.accentVar} 30%, transparent)`,
			}}
		>
			<Box color={config.accentToken} display='inline-flex'>
				<Icon size={12} strokeWidth={2} />
			</Box>
			<Box as='span'>{KIND_BUTTON_LABEL[kind]}</Box>
		</ChakraButton>
	);
};

// ─── Row ──────────────────────────────────────────────────────────────────

type SyncStatus = 'never' | 'fresh' | 'stale';

const SyncIndicator: React.FC<{ status: SyncStatus }> = ({ status }) => {
	const palette =
		status === 'fresh'
			? { icon: CheckCircle2, color: 'var(--beak-colors-accent-success)', label: 'Synced' }
			: status === 'stale'
				? { icon: AlertCircle, color: 'var(--beak-colors-accent-warning)', label: 'Stale — sync hasn’t run in over a day' }
				: { icon: Circle, color: 'var(--beak-colors-fg-subtle)', label: 'Never synced' };
	const Icon = palette.icon;
	return (
		<Box
			display='inline-flex'
			alignItems='center'
			justifyContent='center'
			color={palette.color}
			title={palette.label}
			aria-label='thing'
		>
			<Icon size={11} strokeWidth={2} />
		</Box>
	);
};

const SourceSchemaRow: React.FC<{
	kind: SourceSchemaKind;
	entry: SourceSchemaEntry;
	/** Latest sync error message for this folder, if any. Drives the failure badge + tooltip. */
	syncError?: string;
	onEdit: () => void;
	onDelete: () => void;
	/** Provided only for gRPC rows — fires a method-discovery roundtrip. */
	onDiscover?: () => Promise<void> | void;
	/** Provided only for gRPC rows — opens the try-it dialog (auto-discovers when no cache exists). */
	onInvoke?: () => Promise<void> | void;
	/** Provided only for URL-mode openapi rows — re-fetches the spec. */
	onSync?: () => Promise<void> | void;
}> = ({ kind, entry, syncError, onEdit, onDelete, onDiscover, onInvoke, onSync }) => {
	const config = SOURCE_SCHEMA_CONFIG[kind];
	const Icon = KIND_ICONS[kind];
	const endpoint = 'endpoint' in entry.source && typeof entry.source.endpoint === 'string' ? entry.source.endpoint : '';
	const { status: syncStatus, label: syncLabel } = describeSync(entry.source.lastSyncedAt);
	const descriptor =
		kind === 'grpc' && 'descriptor' in entry.source && entry.source.descriptor ? entry.source.descriptor.type : null;
	const openApi = kind === 'openapi' ? (entry.source as OpenApiSource) : null;
	const seedModeLabel = openApi?.seedMode ?? (openApi?.specUrl ? 'url' : openApi?.specPath ? 'file' : 'paste');
	const sublabel = openApi
		? openApi.specUrl
			? openApi.specUrl
			: openApi.specPath
				? `from ${openApi.specPath}`
				: '(pasted spec)'
		: endpoint || '(no endpoint set)';

	return (
		<Flex
			align='center'
			gap='2'
			px='3'
			py='2'
			role='button'
			tabIndex={0}
			cursor='pointer'
			onClick={onEdit}
			onKeyDown={e => {
				if (e.key === 'Enter' || e.key === ' ') {
					e.preventDefault();
					onEdit();
				}
			}}
			_hover={{ bg: 'color-mix(in srgb, var(--beak-colors-accent-pink) 8%, transparent)' }}
			_focusVisible={{
				outline: 'none',
				bg: 'color-mix(in srgb, var(--beak-colors-accent-pink) 12%, transparent)',
				boxShadow: 'inset 2px 0 0 var(--beak-colors-accent-pink)',
			}}
		>
			<Flex
				align='center'
				justify='center'
				flexShrink={0}
				w='26px'
				h='26px'
				borderRadius='sm'
				bg={`color-mix(in srgb, ${config.accentVar} 12%, transparent)`}
				color={config.accentToken}
			>
				<Icon size={12} strokeWidth={2} />
			</Flex>
			<Flex direction='column' flex='1' minW={0} gap='0.5'>
				<Flex align='center' gap='1.5'>
					<Box fontSize='12px' fontWeight='600' color='fg.default' truncate>
						{entry.folderName}
					</Box>
					<Box
						as='span'
						display='inline-flex'
						alignItems='center'
						h='14px'
						px='1.5'
						borderRadius='sm'
						bg={`color-mix(in srgb, ${config.accentVar} 14%, transparent)`}
						color={config.accentToken}
						fontSize='9.5px'
						fontWeight='600'
						letterSpacing='0.04em'
						textTransform='uppercase'
					>
						{KIND_CHIP_LABEL[kind]}
					</Box>
					{descriptor && (
						<Box
							as='span'
							display='inline-flex'
							alignItems='center'
							h='14px'
							px='1.5'
							borderRadius='sm'
							borderWidth='1px'
							borderColor='border.subtle'
							color='fg.subtle'
							fontSize='9.5px'
							fontWeight='500'
							textTransform='uppercase'
							letterSpacing='0.04em'
						>
							{descriptor}
						</Box>
					)}
					{openApi && (
						<Box
							as='span'
							display='inline-flex'
							alignItems='center'
							h='14px'
							px='1.5'
							borderRadius='sm'
							borderWidth='1px'
							borderColor='border.subtle'
							color='fg.subtle'
							fontSize='9.5px'
							fontWeight='500'
							textTransform='uppercase'
							letterSpacing='0.04em'
						>
							{seedModeLabel}
						</Box>
					)}
				</Flex>
				<Box fontSize='10.5px' color='fg.subtle' fontFamily='mono' truncate>
					{sublabel}
				</Box>
				{syncError ? (
					<Flex align='flex-start' gap='1' color='accent.alert' fontSize='10px' title={syncError}>
						<Box flexShrink={0} mt='0.5'>
							<AlertOctagon size={10} strokeWidth={2.2} />
						</Box>
						<Box truncate lineHeight='1.35'>
							{`Sync failed — ${syncError}`}
						</Box>
					</Flex>
				) : (
					<Flex align='center' gap='1' color='fg.subtle' fontSize='10px'>
						<SyncIndicator status={syncStatus} />
						<Box>{syncLabel}</Box>
					</Flex>
				)}
			</Flex>
			<RowMenu
				folderName={entry.folderName}
				onEdit={onEdit}
				onDelete={onDelete}
				onDiscover={onDiscover}
				onInvoke={onInvoke}
				onSync={onSync}
			/>
		</Flex>
	);
};

const RowMenu: React.FC<{
	folderName: string;
	onEdit: () => void;
	onDelete: () => void;
	onDiscover?: () => Promise<void> | void;
	onInvoke?: () => Promise<void> | void;
	onSync?: () => Promise<void> | void;
}> = ({ folderName, onEdit, onDelete, onDiscover, onInvoke, onSync }) => (
	<Menu.Root>
		<Menu.Trigger asChild>
			<ChakraButton
				type='button'
				aria-label={`More actions for ${folderName}`}
				title='More'
				onClick={e => e.stopPropagation()}
				display='inline-flex'
				alignItems='center'
				justifyContent='center'
				w='22px'
				h='22px'
				borderRadius='sm'
				border='none'
				bg='transparent'
				color='fg.subtle'
				cursor='pointer'
				flexShrink={0}
				_hover={{ color: 'fg.default', bg: 'color-mix(in srgb, var(--beak-colors-fg-default) 8%, transparent)' }}
			>
				<MoreHorizontal size={12} strokeWidth={2} />
			</ChakraButton>
		</Menu.Trigger>
		<Portal>
			<Menu.Positioner>
				<Menu.Content {...glassChakraProps.menu} borderRadius='md' p='1' minW='160px'>
					<RowMenuItem
						icon={Pencil}
						label='Edit source'
						onSelect={e => {
							e.stopPropagation();
							onEdit();
						}}
					/>
					{onDiscover && (
						<RowMenuItem
							icon={RefreshCw}
							label='Discover methods'
							hint='Fetch services + methods from the endpoint'
							onSelect={e => {
								e.stopPropagation();
								void onDiscover();
							}}
						/>
					)}
					{onInvoke && (
						<RowMenuItem
							icon={Play}
							label='Try a method'
							hint='Pick a method and fire a request'
							onSelect={e => {
								e.stopPropagation();
								void onInvoke();
							}}
						/>
					)}
					{onSync && (
						<RowMenuItem
							icon={RefreshCw}
							label='Sync now'
							hint='Re-fetch the spec and overwrite generated requests'
							onSelect={e => {
								e.stopPropagation();
								void onSync();
							}}
						/>
					)}
					<Box h='1px' bg='border.subtle' my='1' />
					<RowMenuItem
						icon={Trash2}
						label='Delete source'
						tone='destructive'
						onSelect={e => {
							e.stopPropagation();
							onDelete();
						}}
					/>
				</Menu.Content>
			</Menu.Positioner>
		</Portal>
	</Menu.Root>
);

const RowMenuItem: React.FC<{
	icon: typeof Pencil;
	label: string;
	hint?: string;
	tone?: 'destructive';
	disabled?: boolean;
	onSelect: (e: React.MouseEvent) => void;
}> = ({ icon: Icon, label, hint, tone, disabled, onSelect }) => (
	<Menu.Item
		value={label}
		disabled={disabled}
		onClick={onSelect as unknown as () => void}
		fontSize='12px'
		fontWeight='500'
		borderRadius='sm'
		py='1.5'
		px='2'
		gap='2'
		color={tone === 'destructive' ? 'accent.alert' : 'fg.default'}
		opacity={disabled ? 0.55 : 1}
		cursor={disabled ? 'not-allowed' : 'pointer'}
		_hover={
			disabled
				? undefined
				: tone === 'destructive'
					? {
							bg: 'color-mix(in srgb, var(--beak-colors-accent-alert) 14%, transparent)',
							color: 'accent.alert',
						}
					: {
							bg: 'color-mix(in srgb, var(--beak-colors-accent-pink) 12%, transparent)',
							color: 'accent.pink',
						}
		}
	>
		<Icon size={12} strokeWidth={1.8} />
		<Flex direction='column' align='flex-start' gap='0' minW={0}>
			<Box as='span'>{label}</Box>
			{hint && (
				<Box as='span' fontSize='10px' color='fg.subtle' fontWeight='400'>
					{hint}
				</Box>
			)}
		</Flex>
	</Menu.Item>
);

// ─── Delete confirm dialog ────────────────────────────────────────────────

const DeleteConfirmDialog: React.FC<{
	entry: SourceSchemaEntry;
	onCancel: () => void;
	onConfirm: () => void;
}> = ({ entry, onCancel, onConfirm }) => (
	<Dialog onClose={onCancel} tone='alert'>
		<Box w='420px'>
			<DialogHeader
				icon={<Trash2 size={14} strokeWidth={2.2} />}
				title={`Delete ${entry.folderName}?`}
				description='Removes the endpoint folder and every request inside it from disk. This cannot be undone.'
			/>
			<DialogBody>
				<Box as='p' fontSize='sm' color='fg.muted' lineHeight='1.55'>
					{'The folder at '}
					<Box as='span' fontFamily='mono' color='fg.default'>
						{entry.folderPath}
					</Box>
					{' will be deleted recursively.'}
				</Box>
			</DialogBody>
			<DialogFooter>
				<Button colour='secondary' size='sm' onClick={onCancel}>
					{'Cancel'}
				</Button>
				<Button colour='destructive' size='sm' onClick={onConfirm}>
					{'Delete endpoint'}
				</Button>
			</DialogFooter>
		</Box>
	</Dialog>
);

export default SourceSchemasPane;
