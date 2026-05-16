import Button from '@beak/ui/components/atoms/Button';
import Dialog, { DialogBody, DialogFooter, DialogHeader } from '@beak/ui/components/molecules/Dialog';
import { changeTab } from '@beak/ui/features/tabs/store/actions';
import { useAppSelector } from '@beak/ui/store/redux';
import { Box, chakra, Flex, Menu, Portal } from '@chakra-ui/react';
import type { RequestNode } from '@getbeak/types/nodes';
import { motion } from 'framer-motion';
import {
	AlertCircle,
	CheckCircle2,
	ChevronDown,
	Circle,
	Hash,
	MoreHorizontal,
	Network,
	Pencil,
	Plug,
	Plus,
	RefreshCw,
	Trash2,
} from 'lucide-react';
import * as React from 'react';
import { useMemo, useState } from 'react';
import { useDispatch } from 'react-redux';

import { useEndpoints } from '../hooks/use-endpoints';
import { deleteEndpointFolder } from '../lib/persist';
import { ENDPOINT_CONFIG, type EndpointEntry, type EndpointKind } from '../types';
import EndpointDialog from './EndpointDialog';

const ChakraButton = chakra('button');

type DialogState =
	| { mode: 'closed' }
	| { mode: 'create'; kind: EndpointKind }
	| { mode: 'edit'; kind: EndpointKind; entry: EndpointEntry }
	| { mode: 'confirm-delete'; kind: EndpointKind; entry: EndpointEntry };

interface UnifiedRow {
	kind: EndpointKind;
	entry: EndpointEntry;
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
const EndpointsPane: React.FC = () => {
	const graphql = useEndpoints('graphql');
	const grpc = useEndpoints('grpc');
	const tree = useAppSelector(s => s.global.project.tree);
	const [dialog, setDialog] = useState<DialogState>({ mode: 'closed' });
	const dispatch = useDispatch();

	function refreshLists() {
		void graphql.refresh();
		void grpc.refresh();
	}

	function closeDialog(didChange: boolean) {
		setDialog({ mode: 'closed' });
		if (didChange) refreshLists();
	}

	/**
	 * Find the seed request inside an endpoint folder. The persist layer
	 * writes either `Introspection.json` (graphql) or `Endpoint.json`
	 * (grpc); we identify it by walking the tree for a request whose
	 * parent is this folder. Multiple requests = pick the first stable
	 * by name.
	 */
	function openEndpointInRequestPane(entry: EndpointEntry) {
		const folder = Object.values(tree).find(n => n.type === 'folder' && n.filePath === entry.folderPath);
		if (!folder) return;
		const requestChild = Object.values(tree)
			.filter((n): n is RequestNode => n.type === 'request' && n.parent === folder.id)
			.sort((a, b) => a.name.localeCompare(b.name))[0];
		if (!requestChild) return;
		dispatch(changeTab({ type: 'request', payload: requestChild.id, temporary: false }));
	}

	async function confirmDelete(entry: EndpointEntry) {
		try {
			await deleteEndpointFolder(entry.folderPath);
			refreshLists();
		} catch (e) {
			console.warn('endpoint delete failed', e);
		} finally {
			setDialog({ mode: 'closed' });
		}
	}

	const rows = useMemo<UnifiedRow[]>(() => {
		const all: UnifiedRow[] = [
			...graphql.entries.map(entry => ({ kind: 'graphql' as const, entry })),
			...grpc.entries.map(entry => ({ kind: 'grpc' as const, entry })),
		];
		all.sort((a, b) => a.entry.relativeFolder.localeCompare(b.entry.relativeFolder));
		return all;
	}, [graphql.entries, grpc.entries]);

	const loading = graphql.loading || grpc.loading;
	const hasRows = rows.length > 0;

	return (
		<React.Fragment>
			<Flex direction='column' flex='1' minH={0}>
				{hasRows && (
					<Flex
						align='center'
						justify='space-between'
						px='3'
						py='2'
						borderBottomWidth='1px'
						borderColor='border.subtle'
						flexShrink={0}
					>
						<Box
							fontSize='10.5px'
							fontWeight='600'
							color='fg.subtle'
							letterSpacing='0.05em'
							textTransform='uppercase'
						>
							{loading ? 'Loading…' : `${rows.length} registered`}
						</Box>
						<AddDropdown onPick={kind => setDialog({ mode: 'create', kind })} />
					</Flex>
				)}

				<Box flex='1' minH={0} overflowY='auto'>
					{!hasRows && !loading && (
						<EmptyState onPick={kind => setDialog({ mode: 'create', kind })} />
					)}

					{hasRows && (
						<Flex direction='column' py='1'>
							{rows.map(({ kind, entry }) => (
								<EndpointRow
									key={entry.folderPath}
									kind={kind}
									entry={entry}
									onOpen={() => openEndpointInRequestPane(entry)}
									onEdit={() => setDialog({ mode: 'edit', kind, entry })}
									onDelete={() => setDialog({ mode: 'confirm-delete', kind, entry })}
								/>
							))}
						</Flex>
					)}
				</Box>
			</Flex>

			{dialog.mode === 'create' && (
				<EndpointDialog endpointKind={dialog.kind} mode={{ kind: 'create' }} onClose={closeDialog} />
			)}
			{dialog.mode === 'edit' && (
				<EndpointDialog
					endpointKind={dialog.kind}
					mode={{
						kind: 'edit',
						folderPath: dialog.entry.folderPath,
						folderName: dialog.entry.folderName,
					}}
					initialEndpoint={typeof dialog.entry.source.endpoint === 'string' ? dialog.entry.source.endpoint : ''}
					initialDescriptor={dialog.kind === 'grpc' && 'descriptor' in dialog.entry.source ? dialog.entry.source.descriptor : undefined}
					onClose={closeDialog}
				/>
			)}
			{dialog.mode === 'confirm-delete' && (
				<DeleteConfirmDialog
					entry={dialog.entry}
					onCancel={() => setDialog({ mode: 'closed' })}
					onConfirm={() => confirmDelete(dialog.entry)}
				/>
			)}
		</React.Fragment>
	);
};

// ─── Add dropdown ─────────────────────────────────────────────────────────

const AddDropdown: React.FC<{ onPick: (kind: EndpointKind) => void }> = ({ onPick }) => (
	<Menu.Root>
		<Menu.Trigger asChild>
			<ChakraButton
				type='button'
				aria-label='Add endpoint'
				title='Add endpoint'
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
				<Menu.Content
					bg='bg.surface.emphasized'
					borderWidth='1px'
					borderColor='border.default'
					borderRadius='md'
					boxShadow='0 8px 24px rgba(0,0,0,0.28)'
					p='1'
					minW='200px'
				>
					<KindMenuItem kind='graphql' onPick={onPick} />
					<KindMenuItem kind='grpc' onPick={onPick} />
				</Menu.Content>
			</Menu.Positioner>
		</Portal>
	</Menu.Root>
);

const KindMenuItem: React.FC<{ kind: EndpointKind; onPick: (kind: EndpointKind) => void }> = ({ kind, onPick }) => {
	const config = ENDPOINT_CONFIG[kind];
	const Icon = kind === 'graphql' ? Hash : Network;
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
					{kind === 'graphql' ? 'Register a GraphQL endpoint' : 'Register a gRPC service'}
				</Box>
			</Flex>
		</Menu.Item>
	);
};

// ─── Empty state ──────────────────────────────────────────────────────────

/**
 * Empty state mirrors the variable-sets EmptyState vocabulary: big pink
 * icon in a tinted circle, large bold title, soft description, single
 * primary CTA. Tightens the surface so the sidebar doesn't look adrift
 * before any endpoints are registered.
 */
const EmptyState: React.FC<{ onPick: (kind: EndpointKind) => void }> = ({ onPick }) => (
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
			{'No endpoints yet'}
		</Box>
		<Box fontSize='xs' color='fg.muted' textAlign='center' maxW='320px' lineHeight='1.5'>
			{'Register a GraphQL endpoint or gRPC service to group every request that hits it under a single folder. Headers, auth, and the schema live on the seed request — opened in the request pane.'}
		</Box>
		<AddDropdownPrimary onPick={onPick} />
	</Flex>
);

const AddDropdownPrimary: React.FC<{ onPick: (kind: EndpointKind) => void }> = ({ onPick }) => (
	<Menu.Root>
		<Menu.Trigger asChild>
			<Button size='sm'>
				<Flex align='center' gap='1.5'>
					<Plus size={12} />
					{'Add your first endpoint'}
					<ChevronDown size={11} strokeWidth={2} style={{ opacity: 0.85 }} />
				</Flex>
			</Button>
		</Menu.Trigger>
		<Portal>
			<Menu.Positioner>
				<Menu.Content
					bg='bg.surface.emphasized'
					borderWidth='1px'
					borderColor='border.default'
					borderRadius='md'
					boxShadow='0 8px 24px rgba(0,0,0,0.28)'
					p='1'
					minW='220px'
				>
					<KindMenuItem kind='graphql' onPick={onPick} />
					<KindMenuItem kind='grpc' onPick={onPick} />
				</Menu.Content>
			</Menu.Positioner>
		</Portal>
	</Menu.Root>
);

// ─── Row ──────────────────────────────────────────────────────────────────

type SyncStatus = 'never' | 'fresh' | 'stale';

function describeSync(lastSyncedAt: string | undefined): { status: SyncStatus; label: string } {
	if (!lastSyncedAt) return { status: 'never', label: 'Never synced' };
	const at = Date.parse(lastSyncedAt);
	if (!Number.isFinite(at)) return { status: 'never', label: 'Never synced' };
	const ageMs = Date.now() - at;
	const minutes = Math.floor(ageMs / 60_000);
	const hours = Math.floor(minutes / 60);
	const days = Math.floor(hours / 24);

	const label =
		minutes < 1
			? 'Synced just now'
			: minutes < 60
				? `Synced ${minutes}m ago`
				: hours < 24
					? `Synced ${hours}h ago`
					: `Synced ${days}d ago`;
	const status: SyncStatus = ageMs < 24 * 60 * 60 * 1000 ? 'fresh' : 'stale';
	return { status, label };
}

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
			aria-label={palette.label}
		>
			<Icon size={11} strokeWidth={2} />
		</Box>
	);
};

const EndpointRow: React.FC<{
	kind: EndpointKind;
	entry: EndpointEntry;
	onOpen: () => void;
	onEdit: () => void;
	onDelete: () => void;
}> = ({ kind, entry, onOpen, onEdit, onDelete }) => {
	const config = ENDPOINT_CONFIG[kind];
	const Icon = kind === 'graphql' ? Hash : Network;
	const endpoint = typeof entry.source.endpoint === 'string' ? entry.source.endpoint : '';
	const { status: syncStatus, label: syncLabel } = describeSync(entry.source.lastSyncedAt);
	const descriptor =
		kind === 'grpc' && 'descriptor' in entry.source && entry.source.descriptor
			? entry.source.descriptor.type
			: null;

	return (
		<Flex
			align='center'
			gap='2'
			px='3'
			py='2'
			role='button'
			tabIndex={0}
			cursor='pointer'
			onClick={onOpen}
			onKeyDown={e => {
				if (e.key === 'Enter' || e.key === ' ') {
					e.preventDefault();
					onOpen();
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
						{kind === 'graphql' ? 'GraphQL' : 'gRPC'}
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
				</Flex>
				<Box fontSize='10.5px' color='fg.subtle' fontFamily='mono' truncate>
					{endpoint || '(no endpoint set)'}
				</Box>
				<Flex align='center' gap='1' color='fg.subtle' fontSize='10px'>
					<SyncIndicator status={syncStatus} />
					<Box>{syncLabel}</Box>
				</Flex>
			</Flex>
			<RowMenu folderName={entry.folderName} onEdit={onEdit} onDelete={onDelete} />
		</Flex>
	);
};

const RowMenu: React.FC<{ folderName: string; onEdit: () => void; onDelete: () => void }> = ({
	folderName,
	onEdit,
	onDelete,
}) => (
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
				<Menu.Content
					bg='bg.surface.emphasized'
					borderWidth='1px'
					borderColor='border.default'
					borderRadius='md'
					boxShadow='0 8px 24px rgba(0,0,0,0.28)'
					p='1'
					minW='160px'
				>
					<RowMenuItem
						icon={Pencil}
						label='Edit endpoint'
						onSelect={e => {
							e.stopPropagation();
							onEdit();
						}}
					/>
					<RowMenuItem
						icon={RefreshCw}
						label='Discover'
						disabled
						hint='Coming soon'
						onSelect={e => e.stopPropagation()}
					/>
					<Box h='1px' bg='border.subtle' my='1' />
					<RowMenuItem
						icon={Trash2}
						label='Delete endpoint'
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
	entry: EndpointEntry;
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

export default EndpointsPane;
