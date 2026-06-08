import type { CollectionSource, GrpcDescriptor } from '@beak/state/schemas';
import Button from '@beak/ui/components/atoms/Button';
import Dialog, { DialogBody, DialogFooter, DialogHeader } from '@beak/ui/components/molecules/Dialog';
import { Box, chakra, Flex } from '@chakra-ui/react';
import {
	AlertCircle,
	AlertOctagon,
	AlertTriangle,
	CheckCircle2,
	Circle,
	ClipboardPaste,
	FileCode,
	FileText,
	Folder,
	Globe,
	Hash,
	Network,
	Play,
	Radio,
	RefreshCw,
} from 'lucide-react';
import * as React from 'react';
import { useEffect, useState } from 'react';

import { pickSpecFile } from '../../openapi-import/pick-file';
import {
	createOpenApiSourceSchemaFolder,
	createSourceSchemaFolder,
	deriveFolderNameFromUrl,
	peekRootSource,
	updateOpenApiSourceSchema,
	updateSourceSchema,
} from '../lib/persist';
import { describeSync, type SyncStatus } from '../lib/sync-status';
import { type OpenApiSource, SOURCE_SCHEMA_CONFIG, type SourceSchemaKind } from '../types';

type Mode = { kind: 'create' } | { kind: 'edit'; folderPath: string; folderName: string };

interface SourceSchemaDialogProps {
	sourceSchemaKind: SourceSchemaKind;
	mode: Mode;
	initialEndpoint?: string;
	/** Existing descriptor on the source — only meaningful when kind is grpc. */
	initialDescriptor?: GrpcDescriptor;
	/** Existing openapi source — only meaningful when kind is openapi & editing. */
	initialOpenApiSource?: OpenApiSource;
	/**
	 * Latest sync timestamp pulled live from the registry — passed separately
	 * so the "Last synced" line refreshes after `onSyncNow` runs, without the
	 * caller having to remount the dialog with a new entry snapshot.
	 */
	lastSyncedAt?: string;
	/**
	 * Manual re-sync handler. Wired only for kinds that have a re-syncable
	 * source (OpenAPI URL mode) — undefined disables the button.
	 */
	onSyncNow?: () => Promise<void> | void;
	/**
	 * GraphQL-only — opens the seeded introspection request. Tunneled through
	 * here so the dialog can offer it without having to know about the tree
	 * shape or `changeTab`.
	 */
	onOpenIntrospection?: () => void;
	onClose: (didChange: boolean) => void;
}

type DescriptorKind = 'reflection' | 'proto' | 'buf';

const ChakraInput = chakra('input');

/**
 * Reject folder names that would either break on common filesystems or
 * collide with Beak's reserved metadata. Returns `null` when the name is
 * acceptable, an error message otherwise. Blank is allowed — it means
 * "drop the source at the project root"; callers handle that branch
 * separately.
 */
function validateFolderName(raw: string): string | null {
	const name = raw.trim();
	if (!name) return null;
	if (name.includes('/') || name.includes('\\')) return 'No slashes — pick a single folder name.';
	// Reserved on Windows + characters that need shell quoting on POSIX. Banning
	// them across the board keeps projects portable without per-platform
	// guesswork. The control-char range \x00-\x1f is intentional here.
	// biome-ignore lint/suspicious/noControlCharactersInRegex: intentional — validating against control chars
	if (/[<>:"|?*\x00-\x1f]/.test(name)) return 'Use plain characters — no control characters, <, >, :, ", |, ?, or *.';
	if (name === '.' || name === '..') return '“.” and “..” aren’t valid folder names.';
	if (name.startsWith('.') || name.startsWith('-')) return 'Don’t start with a dot or dash.';
	if (name.endsWith('.') || name.endsWith(' ')) return 'Don’t end with a dot or space.';
	// `_collection` is the Beak metadata filename; underscore-prefixed names
	// collide with the hidden-folder convention.
	if (name.startsWith('_')) return 'Names starting with “_” are reserved for Beak metadata.';
	if (name.length > 80) return 'Keep it under 80 characters.';
	return null;
}

/**
 * Endpoint authoring surface — single-column form using the shared Dialog
 * primitives. The destination-folder preview lives inline as a quiet
 * monospace chip beneath the form, replacing the previous two-pane layout
 * whose sidebar made the dialog feel busy without paying its weight.
 */
/**
 * Dispatcher: OpenAPI renders its own dialog (which owns its hooks); the gRPC
 * and GraphQL variants share `GrpcOrGraphqlSourceSchemaDialog` (which owns its
 * hooks). Keeping the dispatch hook-free is mandatory — Rules of Hooks forbids
 * a conditional early-return before useState calls.
 */
const SourceSchemaDialog: React.FC<SourceSchemaDialogProps> = props => {
	if (props.sourceSchemaKind === 'openapi')
		return (
			<OpenApiSourceSchemaDialog
				mode={props.mode}
				initialOpenApiSource={props.initialOpenApiSource}
				lastSyncedAt={props.lastSyncedAt}
				onSyncNow={props.onSyncNow}
				onClose={props.onClose}
			/>
		);
	return <GrpcOrGraphqlSourceSchemaDialog {...props} sourceSchemaKind={props.sourceSchemaKind} />;
};

interface GrpcOrGraphqlSourceSchemaDialogProps extends Omit<SourceSchemaDialogProps, 'sourceSchemaKind'> {
	sourceSchemaKind: Exclude<SourceSchemaDialogProps['sourceSchemaKind'], 'openapi'>;
}

const GrpcOrGraphqlSourceSchemaDialog: React.FC<GrpcOrGraphqlSourceSchemaDialogProps> = ({
	sourceSchemaKind,
	mode,
	initialEndpoint,
	initialDescriptor,
	lastSyncedAt,
	onOpenIntrospection,
	onClose,
}) => {
	const config = SOURCE_SCHEMA_CONFIG[sourceSchemaKind];
	const isCreate = mode.kind === 'create';
	const isGrpc = sourceSchemaKind === 'grpc';

	const [folderName, setFolderName] = useState(isCreate ? '' : mode.kind === 'edit' ? mode.folderName : '');
	const [endpoint, setEndpoint] = useState(initialEndpoint ?? '');
	const [deriveFromUrl, setDeriveFromUrl] = useState(false);
	const [descriptorKind, setDescriptorKind] = useState<DescriptorKind>(initialDescriptor?.type ?? 'reflection');
	const [protoPath, setProtoPath] = useState(initialDescriptor?.type === 'proto' ? initialDescriptor.path : '');
	const [bufModule, setBufModule] = useState(initialDescriptor?.type === 'buf' ? initialDescriptor.module : '');
	const [rootSource, setRootSource] = useState<CollectionSource | null>(null);
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const derivedFolderName = React.useMemo(() => deriveFolderNameFromUrl(endpoint), [endpoint]);
	const effectiveFolderName = isCreate ? (deriveFromUrl ? derivedFolderName : folderName.trim()) : folderName.trim();
	const isDroppingAtRoot = isCreate && effectiveFolderName.length === 0;

	function buildDescriptor(): GrpcDescriptor | undefined {
		if (!isGrpc) return undefined;
		switch (descriptorKind) {
			case 'reflection':
				return { type: 'reflection' };
			case 'proto':
				return protoPath.trim().length > 0 ? { type: 'proto', path: protoPath.trim() } : undefined;
			case 'buf':
				return bufModule.trim().length > 0 ? { type: 'buf', module: bufModule.trim() } : undefined;
		}
	}

	const descriptorReady =
		!isGrpc ||
		descriptorKind === 'reflection' ||
		(descriptorKind === 'proto' && protoPath.trim().length > 0) ||
		(descriptorKind === 'buf' && bufModule.trim().length > 0);

	const folderNameError = isCreate ? validateFolderName(deriveFromUrl ? derivedFolderName : folderName) : null;
	const canSubmit =
		!busy && endpoint.trim().length > 0 && descriptorReady && (isCreate ? folderNameError === null : true);

	// Peek the root collection when the user is about to drop at root so we
	// can warn before overwriting a non-manual source. Multiple sources
	// across the project are fine — only the root is single-occupancy.
	useEffect(() => {
		if (!isCreate || !isDroppingAtRoot) {
			setRootSource(null);
			return;
		}
		let cancelled = false;
		peekRootSource()
			.then(src => {
				if (!cancelled) setRootSource(src);
			})
			.catch(() => {
				if (!cancelled) setRootSource(null);
			});
		return () => {
			cancelled = true;
		};
	}, [isCreate, isDroppingAtRoot]);

	async function submit() {
		setBusy(true);
		setError(null);
		try {
			if (mode.kind === 'create') {
				await createSourceSchemaFolder({
					kind: sourceSchemaKind,
					folderName: effectiveFolderName,
					endpoint: endpoint.trim(),
					descriptor: buildDescriptor(),
				});
			} else {
				await updateSourceSchema(mode.folderPath, sourceSchemaKind, {
					endpoint: endpoint.trim(),
					descriptor: buildDescriptor(),
				});
			}
			onClose(true);
		} catch (e) {
			const message = e instanceof Error ? e.message : String(e);
			setError(message);
		} finally {
			setBusy(false);
		}
	}

	const folderPreview = effectiveFolderName ? `${effectiveFolderName}/` : 'project root';
	const rootWarning = buildRootWarning(rootSource, sourceSchemaKind, isDroppingAtRoot);
	const KindIcon = sourceSchemaKind === 'graphql' ? Hash : Network;
	const tone = sourceSchemaKind === 'graphql' ? 'indigo' : 'teal';

	return (
		<Dialog onClose={() => onClose(false)} tone={tone}>
			<Box w='480px'>
				<DialogHeader
					icon={<KindIcon size={14} strokeWidth={2.2} />}
					title={isCreate ? `Add ${config.label}` : `Edit ${config.label}`}
					description={
						isCreate
							? config.tagline
							: 'Update the endpoint URL or the folder name. Requests in this folder pick up the change immediately.'
					}
				/>
				<DialogBody>
					<Flex direction='column' gap='3'>
						{isCreate && (
							<Field
								label='Folder name'
								description='Leave blank to drop the source at the project root — handy when this is the only source in the project.'
							>
								<DialogInput
									autoFocus
									value={deriveFromUrl ? derivedFolderName : folderName}
									placeholder='acme-api'
									onChange={deriveFromUrl ? () => {} : setFolderName}
									accentVar={config.accentVar}
									disabled={deriveFromUrl}
								/>
								{folderName.trim().length > 0 && folderNameError && (
									<Box mt='1' fontSize='10px' color='accent.alert' lineHeight='1.4'>
										{folderNameError}
									</Box>
								)}
							</Field>
						)}
						{isCreate && <DeriveFromUrlToggle checked={deriveFromUrl} onChange={setDeriveFromUrl} />}
						<Field
							label='Endpoint URL'
							description={
								sourceSchemaKind === 'graphql'
									? 'The GraphQL endpoint requests inside this folder send to.'
									: 'The gRPC service address. Plain `host:port` is fine.'
							}
						>
							<DialogInput
								autoFocus={!isCreate}
								value={endpoint}
								placeholder={config.endpointPlaceholder}
								onChange={setEndpoint}
								accentVar={config.accentVar}
							/>
						</Field>

						{isGrpc && (
							<Field
								label='Schema source'
								description={
									descriptorKind === 'reflection'
										? 'Use the gRPC server reflection service to fetch method + message descriptors on demand.'
										: descriptorKind === 'proto'
											? 'Parse a local `.proto` file to derive the descriptors.'
											: 'Pull the descriptors from a Buf Schema Registry module.'
								}
							>
								<Flex direction='column' gap='2'>
									<DescriptorPicker value={descriptorKind} onChange={setDescriptorKind} accentVar={config.accentVar} />
									{descriptorKind === 'proto' && (
										<DialogInput
											value={protoPath}
											placeholder='./protos/service.proto'
											onChange={setProtoPath}
											accentVar={config.accentVar}
										/>
									)}
									{descriptorKind === 'buf' && (
										<DialogInput
											value={bufModule}
											placeholder='buf.build/connectrpc/eliza'
											onChange={setBufModule}
											accentVar={config.accentVar}
										/>
									)}
								</Flex>
							</Field>
						)}

						<SavesToChip preview={folderPreview} accentToken={config.accentToken} />

						{rootWarning && <RootOverrideWarning message={rootWarning} />}

						{!isCreate && sourceSchemaKind === 'graphql' && onOpenIntrospection && (
							<IntrospectionLauncher onOpen={onOpenIntrospection} accentVar={config.accentVar} />
						)}

						{!isCreate && <SyncStatusChip lastSyncedAt={lastSyncedAt} onSyncNow={undefined} syncing={false} />}

						{error && (
							<Flex
								align='center'
								gap='2'
								px='2.5'
								py='1.5'
								borderRadius='md'
								borderWidth='1px'
								borderColor='color-mix(in srgb, var(--beak-colors-accent-alert) 38%, var(--beak-colors-border-subtle))'
								bg='color-mix(in srgb, var(--beak-colors-accent-alert) 10%, var(--beak-colors-bg-surface))'
								fontSize='xs'
							>
								<Box color='accent.alert' flex='0 0 auto'>
									<AlertOctagon size={13} />
								</Box>
								<Box color='fg.default'>{error}</Box>
							</Flex>
						)}
					</Flex>
				</DialogBody>
				<DialogFooter>
					<Button colour='secondary' size='sm' onClick={() => onClose(false)}>
						{'Cancel'}
					</Button>
					<Button size='sm' disabled={!canSubmit} onClick={submit}>
						{busy ? 'Saving…' : isCreate ? `Add ${config.label.toLowerCase()}` : 'Save changes'}
					</Button>
				</DialogFooter>
			</Box>
		</Dialog>
	);
};

/**
 * Small inline call-to-action shown in the GraphQL edit dialog. Replaces the
 * old "click the row to open introspection" flow — the user explicitly
 * opted into clicking the row to *edit*, so we surface the introspection
 * request behind an explicit button instead of as an implicit side effect.
 */
const IntrospectionLauncher: React.FC<{ onOpen: () => void; accentVar: string }> = ({ onOpen, accentVar }) => (
	<Flex
		align='center'
		gap='2'
		px='2.5'
		py='1.5'
		borderRadius='md'
		borderWidth='1px'
		borderColor='border.subtle'
		bg='bg.canvas'
		fontSize='xs'
	>
		<Box color='accent.indigo' flex='0 0 auto'>
			<Play size={11} strokeWidth={2} />
		</Box>
		<Box flex='1 1 auto' color='fg.muted' lineHeight='1.4'>
			{'Run the introspection query to fetch this endpoint’s schema.'}
		</Box>
		<chakra.button
			type='button'
			onClick={onOpen}
			display='inline-flex'
			alignItems='center'
			gap='1'
			h='24px'
			px='2.5'
			borderRadius='sm'
			borderWidth='1px'
			borderColor='border.subtle'
			bg='transparent'
			color='fg.default'
			fontSize='11.5px'
			fontWeight='600'
			cursor='pointer'
			transition='border-color .12s ease, background-color .12s ease, color .12s ease'
			_hover={{
				color: 'accent.indigo',
				borderColor: 'accent.indigo',
				bg: `color-mix(in srgb, ${accentVar} 10%, transparent)`,
			}}
		>
			{'Open introspection request'}
		</chakra.button>
	</Flex>
);

interface FieldProps {
	label: string;
	description?: string;
}

const Field: React.FC<React.PropsWithChildren<FieldProps>> = ({ label, description, children }) => (
	<Flex direction='column' gap='1'>
		<Box as='label' fontSize='10px' fontWeight='700' color='fg.subtle' letterSpacing='0.06em' textTransform='uppercase'>
			{label}
		</Box>
		{children}
		{description && (
			<Box fontSize='11px' color='fg.subtle' lineHeight='1.45'>
				{description}
			</Box>
		)}
	</Flex>
);

const DialogInput: React.FC<{
	value: string;
	placeholder?: string;
	autoFocus?: boolean;
	accentVar: string;
	onChange: (v: string) => void;
	width?: string;
	inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode'];
	align?: 'left' | 'right';
	disabled?: boolean;
}> = ({ value, placeholder, autoFocus, accentVar, onChange, width, inputMode, align, disabled }) => (
	<ChakraInput
		type='text'
		value={value}
		autoFocus={autoFocus}
		placeholder={placeholder}
		disabled={disabled}
		inputMode={inputMode}
		onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(e.currentTarget.value)}
		w={width ?? '100%'}
		h='32px'
		px='2.5'
		fontSize='13px'
		fontFamily='inherit'
		color='fg.default'
		bg='bg.canvas'
		borderRadius='md'
		borderWidth='1px'
		borderColor='border.subtle'
		outline='none'
		opacity={disabled ? 0.55 : 1}
		transition='border-color .12s ease, box-shadow .12s ease'
		_placeholder={{ color: 'fg.subtle' }}
		style={{ caretColor: accentVar, textAlign: align === 'right' ? 'right' : undefined }}
		_hover={{ borderColor: 'border.emphasized' }}
		_focus={{
			borderColor: 'transparent',
			boxShadow: `inset 0 0 0 1px ${accentVar}, 0 0 0 3px color-mix(in srgb, ${accentVar} 18%, transparent)`,
		}}
	/>
);

/**
 * Three-way segmented control for the gRPC schema-source picker. The icons
 * give a quick read on each option's flavour: Radio for over-the-wire
 * reflection, FileCode for a local proto, Network for the BSR (the Network
 * icon already belongs to the gRPC kind so the BSR reuse reads as
 * "another network-fetched descriptor source").
 */
const DescriptorPicker: React.FC<{
	value: DescriptorKind;
	onChange: (next: DescriptorKind) => void;
	accentVar: string;
}> = ({ value, onChange, accentVar }) => {
	const options: { kind: DescriptorKind; label: string; Icon: typeof Radio }[] = [
		{ kind: 'reflection', label: 'Reflection', Icon: Radio },
		{ kind: 'proto', label: 'Proto file', Icon: FileCode },
		{ kind: 'buf', label: 'Buf module', Icon: Network },
	];
	const ChakraButton = chakra('button');
	return (
		<Flex align='stretch' borderWidth='1px' borderColor='border.subtle' borderRadius='md' p='0.5' gap='0.5'>
			{options.map(opt => {
				const active = opt.kind === value;
				return (
					<ChakraButton
						key={opt.kind}
						type='button'
						aria-pressed={active}
						onClick={() => onChange(opt.kind)}
						display='inline-flex'
						alignItems='center'
						justifyContent='center'
						gap='1'
						flex='1 1 0'
						h='26px'
						px='2'
						borderRadius='sm'
						border='none'
						bg={active ? `color-mix(in srgb, ${accentVar} 14%, transparent)` : 'transparent'}
						color={active ? 'fg.default' : 'fg.muted'}
						fontSize='11.5px'
						fontWeight={active ? '600' : '500'}
						cursor='pointer'
						transition='color .12s ease, background-color .12s ease'
						_hover={
							active
								? undefined
								: { bg: 'color-mix(in srgb, var(--beak-colors-accent-pink) 10%, transparent)', color: 'fg.default' }
						}
						_focusVisible={{
							outline: 'none',
							boxShadow: '0 0 0 2px color-mix(in srgb, var(--beak-colors-accent-pink) 30%, transparent)',
						}}
					>
						<opt.Icon size={11} strokeWidth={2} />
						<Box as='span'>{opt.label}</Box>
					</ChakraButton>
				);
			})}
		</Flex>
	);
};

// ─── OpenAPI dialog ───────────────────────────────────────────────────────

type OpenApiSourceMode = 'file' | 'url' | 'paste';

interface OpenApiSourceSchemaDialogProps {
	mode: Mode;
	initialOpenApiSource?: OpenApiSource;
	/** Live sync timestamp — see SourceSchemaDialogProps. */
	lastSyncedAt?: string;
	/** Manual re-sync trigger — only meaningful for URL sources. */
	onSyncNow?: () => Promise<void> | void;
	onClose: (didChange: boolean) => void;
}

/**
 * OpenAPI authoring surface. Three-tab "Source" picker (File / URL / Paste)
 * drives a folder full of generated request files. URL mode is the only one
 * that supports re-sync — file/paste persist a marker so the row knows what
 * generated it but can't be auto-resynced (file mode picker is host-agnostic
 * via the browser File API; the absolute path isn't persisted).
 *
 * Edit mode is meaningful only for URL sources (you can change the URL or
 * the auto-sync cadence). File/paste edit just shows source info.
 */
const OpenApiSourceSchemaDialog: React.FC<OpenApiSourceSchemaDialogProps> = ({
	mode,
	initialOpenApiSource,
	lastSyncedAt,
	onSyncNow,
	onClose,
}) => {
	const config = SOURCE_SCHEMA_CONFIG.openapi;
	const isCreate = mode.kind === 'create';
	const seededMode: OpenApiSourceMode =
		initialOpenApiSource?.seedMode ??
		(initialOpenApiSource?.specUrl ? 'url' : initialOpenApiSource?.specPath ? 'file' : 'paste');

	const [folderName, setFolderName] = useState(isCreate ? '' : mode.kind === 'edit' ? mode.folderName : '');
	const [sourceMode, setSourceMode] = useState<OpenApiSourceMode>(isCreate ? 'url' : seededMode);
	const [url, setUrl] = useState(initialOpenApiSource?.specUrl ?? '');
	const [autoSync, setAutoSync] = useState(Boolean(initialOpenApiSource?.autoSync));
	const [intervalMinutes, setIntervalMinutes] = useState(String(initialOpenApiSource?.intervalMinutes ?? 60));
	const [pickedFilename, setPickedFilename] = useState<string | null>(initialOpenApiSource?.specPath ?? null);
	const [pickedSource, setPickedSource] = useState<string | null>(null);
	const [pasteContent, setPasteContent] = useState('');
	const [groupByPath, setGroupByPath] = useState(false);
	const [rootSource, setRootSource] = useState<CollectionSource | null>(null);
	const [busy, setBusy] = useState(false);
	const [syncing, setSyncing] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const trimmedFolderName = folderName.trim();
	const isDroppingAtRoot = isCreate && trimmedFolderName.length === 0;

	useEffect(() => {
		if (!isCreate || !isDroppingAtRoot) {
			setRootSource(null);
			return;
		}
		let cancelled = false;
		peekRootSource()
			.then(src => {
				if (!cancelled) setRootSource(src);
			})
			.catch(() => {
				if (!cancelled) setRootSource(null);
			});
		return () => {
			cancelled = true;
		};
	}, [isCreate, isDroppingAtRoot]);

	async function handleSyncNow() {
		if (!onSyncNow) return;
		setSyncing(true);
		setError(null);
		try {
			await onSyncNow();
		} catch (e) {
			setError(e instanceof Error ? e.message : String(e));
		} finally {
			setSyncing(false);
		}
	}

	async function pickFile() {
		setError(null);
		const result = await pickSpecFile();
		if (!result) return;
		setPickedFilename(result.filename);
		setPickedSource(result.source);
	}

	const folderNameError = isCreate ? validateFolderName(folderName) : null;
	const folderReady = !isCreate || folderNameError === null;
	const sourceReady = !isCreate
		? sourceMode === 'url'
			? url.trim().length > 0
			: true
		: sourceMode === 'url'
			? url.trim().length > 0
			: sourceMode === 'file'
				? pickedSource !== null
				: pasteContent.trim().length > 0;
	const canSubmit = !busy && folderReady && sourceReady;

	async function submit() {
		setBusy(true);
		setError(null);
		try {
			const minutes = (() => {
				const n = Number(intervalMinutes);
				return Number.isFinite(n) && n >= 1 ? Math.floor(n) : 60;
			})();
			if (mode.kind === 'create') {
				const groupOpt = groupByPath ? { groupByPath: true as const } : {};
				if (sourceMode === 'url') {
					await createOpenApiSourceSchemaFolder({
						folderName: trimmedFolderName,
						...groupOpt,
						seed: { mode: 'url', url: url.trim(), autoSync, intervalMinutes: minutes },
					});
				} else if (sourceMode === 'file') {
					if (!pickedSource || !pickedFilename) throw new Error('Pick a spec file first.');
					await createOpenApiSourceSchemaFolder({
						folderName: trimmedFolderName,
						...groupOpt,
						seed: { mode: 'file', filename: pickedFilename, source: pickedSource },
					});
				} else {
					await createOpenApiSourceSchemaFolder({
						folderName: trimmedFolderName,
						...groupOpt,
						seed: { mode: 'paste', source: pasteContent },
					});
				}
			} else {
				if (sourceMode !== 'url') throw new Error('Only URL sources can be edited — re-create to change the source.');
				await updateOpenApiSourceSchema(mode.folderPath, { url: url.trim(), autoSync, intervalMinutes: minutes });
			}
			onClose(true);
		} catch (e) {
			const message = e instanceof Error ? e.message : String(e);
			setError(message);
		} finally {
			setBusy(false);
		}
	}

	const folderPreview = trimmedFolderName ? `${trimmedFolderName}/` : isCreate ? 'project root' : `${folderName}/`;
	const rootWarning = buildRootWarning(rootSource, 'openapi', isDroppingAtRoot);

	return (
		<Dialog onClose={() => onClose(false)} tone='pink'>
			<Box w='520px'>
				<DialogHeader
					icon={<FileText size={14} strokeWidth={2.2} />}
					title={isCreate ? `Add ${config.label}` : `Edit ${config.label}`}
					description={
						isCreate
							? config.tagline
							: 'Update the URL or auto-sync cadence. To swap the source file/paste, delete this endpoint and re-add it.'
					}
				/>
				<DialogBody>
					<Flex direction='column' gap='3'>
						{isCreate && (
							<Field
								label='Folder name'
								description='Leave blank to drop the generated requests at the project root — handy when this is the only spec in the project.'
							>
								<DialogInput
									autoFocus
									value={folderName}
									placeholder='petstore'
									onChange={setFolderName}
									accentVar={config.accentVar}
								/>
								{folderName.trim().length > 0 && folderNameError && (
									<Box mt='1' fontSize='10px' color='accent.alert' lineHeight='1.4'>
										{folderNameError}
									</Box>
								)}
							</Field>
						)}

						<Field
							label='Source'
							description={
								sourceMode === 'url'
									? 'Beak fetches the spec from this URL on demand — and on a cadence if you turn on auto-sync.'
									: sourceMode === 'file'
										? 'Pick a local spec file. The filename is recorded so the row can show where the spec came from; re-sync re-prompts you for the file.'
										: 'Paste the spec text. One-shot — there’s no source to re-sync from.'
							}
						>
							<Flex direction='column' gap='2'>
								<SourceModePicker
									value={sourceMode}
									onChange={next => {
										setSourceMode(next);
										setError(null);
									}}
									accentVar={config.accentVar}
									editMode={!isCreate}
								/>
								{sourceMode === 'url' && (
									<DialogInput
										autoFocus={!isCreate}
										value={url}
										placeholder='https://example.com/openapi.yaml'
										onChange={setUrl}
										accentVar={config.accentVar}
									/>
								)}
								{sourceMode === 'file' && isCreate && (
									<Flex align='center' gap='2'>
										<Button size='sm' colour='secondary' onClick={() => void pickFile()}>
											{pickedFilename ? 'Pick a different file' : 'Choose spec file…'}
										</Button>
										{pickedFilename && (
											<Box fontFamily='mono' fontSize='11px' color='fg.muted' truncate>
												{pickedFilename}
											</Box>
										)}
									</Flex>
								)}
								{sourceMode === 'file' && !isCreate && (
									<Box fontFamily='mono' fontSize='11px' color='fg.subtle'>
										{pickedFilename ?? '(no filename recorded)'}
									</Box>
								)}
								{sourceMode === 'paste' && isCreate && (
									<PasteArea value={pasteContent} onChange={setPasteContent} accentVar={config.accentVar} />
								)}
								{sourceMode === 'paste' && !isCreate && (
									<Box fontSize='11px' color='fg.subtle' lineHeight='1.45'>
										{'Pasted specs aren’t kept around — to re-import, delete and re-add this endpoint.'}
									</Box>
								)}
							</Flex>
						</Field>

						{isCreate && (
							<Flex
								as='label'
								align='flex-start'
								gap='2'
								cursor='pointer'
								fontSize='xs'
								color='fg.muted'
								px='1'
								borderRadius='md'
								_hover={{ color: 'fg.default' }}
							>
								<input
									type='checkbox'
									checked={groupByPath}
									onChange={e => setGroupByPath(e.currentTarget.checked)}
									style={{ marginTop: '2px' }}
								/>
								<Box>
									<Box fontWeight='600' color='fg.default'>
										{'Group by URL path'}
									</Box>
									<Box fontSize='10px' color='fg.subtle' mt='0.5'>
										{'Mirror the URL hierarchy in the tree — '}
										<Box as='span' fontFamily='mono'>
											{'/api/agents/{id}'}
										</Box>
										{' lands under '}
										<Box as='span' fontFamily='mono'>
											{'api/agents/'}
										</Box>
										{' instead of all in one folder.'}
									</Box>
								</Box>
							</Flex>
						)}

						{sourceMode === 'url' && (
							<Field
								label='Auto-sync'
								description='Beak refreshes URL-sourced specs in the background. Changes overwrite the generated request files in this folder.'
							>
								<Flex align='center' gap='4' wrap='wrap'>
									<Flex as='label' align='center' gap='1.5' cursor='pointer' fontSize='xs' color='fg.muted'>
										<input type='checkbox' checked={autoSync} onChange={e => setAutoSync(e.currentTarget.checked)} />
										{'Keep in sync automatically'}
									</Flex>
									<Flex align='center' gap='1.5' fontSize='xs' color='fg.muted'>
										{'Every'}
										<DialogInput
											value={intervalMinutes}
											onChange={setIntervalMinutes}
											accentVar={config.accentVar}
											width='64px'
											inputMode='numeric'
											align='right'
											disabled={!autoSync}
										/>
										{'minutes'}
									</Flex>
								</Flex>
							</Field>
						)}

						<SavesToChip preview={folderPreview} accentToken={config.accentToken} />

						{rootWarning && <RootOverrideWarning message={rootWarning} />}

						{!isCreate && (
							<SyncStatusChip
								lastSyncedAt={lastSyncedAt}
								onSyncNow={onSyncNow ? handleSyncNow : undefined}
								syncing={syncing}
							/>
						)}

						{error && (
							<Flex
								align='center'
								gap='2'
								px='2.5'
								py='1.5'
								borderRadius='md'
								borderWidth='1px'
								borderColor='color-mix(in srgb, var(--beak-colors-accent-alert) 38%, var(--beak-colors-border-subtle))'
								bg='color-mix(in srgb, var(--beak-colors-accent-alert) 10%, var(--beak-colors-bg-surface))'
								fontSize='xs'
							>
								<Box color='accent.alert' flex='0 0 auto'>
									<AlertOctagon size={13} />
								</Box>
								<Box color='fg.default'>{error}</Box>
							</Flex>
						)}
					</Flex>
				</DialogBody>
				<DialogFooter>
					<Button colour='secondary' size='sm' onClick={() => onClose(false)}>
						{'Cancel'}
					</Button>
					<Button size='sm' disabled={!canSubmit} onClick={submit}>
						{busy ? (isCreate ? 'Importing…' : 'Saving…') : isCreate ? 'Import spec' : 'Save changes'}
					</Button>
				</DialogFooter>
			</Box>
		</Dialog>
	);
};

/**
 * Inline "Last synced …" chip with an optional "Sync now" trigger. Lives in
 * the dialog body, just below the form, so the user can see the freshness
 * of the registry-owned data and force a refresh without dismissing the
 * dialog. `syncing` drives the spinning icon + label swap while a manual
 * sync is in flight.
 */
const SyncStatusChip: React.FC<{
	lastSyncedAt: string | undefined;
	onSyncNow?: () => Promise<void> | void;
	syncing: boolean;
}> = ({ lastSyncedAt, onSyncNow, syncing }) => {
	const { status, label } = describeSync(lastSyncedAt);
	const palette = SYNC_PALETTE[status];
	const Icon = palette.Icon;
	return (
		<Flex
			align='center'
			gap='2'
			px='2.5'
			py='1.5'
			borderRadius='md'
			borderWidth='1px'
			borderColor='border.subtle'
			bg='bg.canvas'
			fontSize='xs'
		>
			<Box color={palette.color} flex='0 0 auto' display='inline-flex'>
				<Icon size={11} strokeWidth={2} />
			</Box>
			<Box color='fg.subtle' fontSize='10px' fontWeight='700' textTransform='uppercase' letterSpacing='0.06em'>
				{'Sync'}
			</Box>
			<Box flex='1 1 auto' color='fg.muted'>
				{syncing ? 'Syncing…' : label}
			</Box>
			{onSyncNow && (
				<chakra.button
					type='button'
					onClick={() => void onSyncNow()}
					disabled={syncing}
					display='inline-flex'
					alignItems='center'
					gap='1'
					h='24px'
					px='2.5'
					borderRadius='sm'
					borderWidth='1px'
					borderColor='border.subtle'
					bg='transparent'
					color='fg.default'
					fontSize='11.5px'
					fontWeight='600'
					cursor={syncing ? 'wait' : 'pointer'}
					opacity={syncing ? 0.6 : 1}
					transition='border-color .12s ease, background-color .12s ease, color .12s ease'
					_hover={
						syncing
							? undefined
							: {
									color: 'accent.pink',
									borderColor: 'accent.pink',
									bg: 'color-mix(in srgb, var(--beak-colors-accent-pink) 10%, transparent)',
								}
					}
					css={
						syncing
							? {
									'@keyframes endpoint-sync-spin': {
										from: { transform: 'rotate(0deg)' },
										to: { transform: 'rotate(360deg)' },
									},
									'> svg.lucide-refresh-cw': { animation: 'endpoint-sync-spin 1s linear infinite' },
								}
							: undefined
					}
				>
					<RefreshCw size={11} strokeWidth={2.2} />
					{syncing ? 'Syncing…' : 'Sync now'}
				</chakra.button>
			)}
		</Flex>
	);
};

const SYNC_PALETTE: Record<SyncStatus, { Icon: typeof CheckCircle2; color: string }> = {
	fresh: { Icon: CheckCircle2, color: 'accent.success' },
	stale: { Icon: AlertCircle, color: 'accent.warning' },
	never: { Icon: Circle, color: 'fg.subtle' },
};

const SourceModePicker: React.FC<{
	value: OpenApiSourceMode;
	onChange: (next: OpenApiSourceMode) => void;
	accentVar: string;
	editMode: boolean;
}> = ({ value, onChange, accentVar, editMode }) => {
	const ChakraButton = chakra('button');
	const options: { kind: OpenApiSourceMode; label: string; Icon: typeof Globe }[] = [
		{ kind: 'url', label: 'URL', Icon: Globe },
		{ kind: 'file', label: 'File', Icon: FileText },
		{ kind: 'paste', label: 'Paste', Icon: ClipboardPaste },
	];
	return (
		<Flex align='stretch' borderWidth='1px' borderColor='border.subtle' borderRadius='md' p='0.5' gap='0.5'>
			{options.map(opt => {
				const active = opt.kind === value;
				const disabled = editMode && opt.kind !== value;
				return (
					<ChakraButton
						key={opt.kind}
						type='button'
						aria-pressed={active}
						disabled={disabled}
						onClick={() => onChange(opt.kind)}
						display='inline-flex'
						alignItems='center'
						justifyContent='center'
						gap='1'
						flex='1 1 0'
						h='26px'
						px='2'
						borderRadius='sm'
						border='none'
						bg={active ? `color-mix(in srgb, ${accentVar} 14%, transparent)` : 'transparent'}
						color={active ? 'fg.default' : 'fg.muted'}
						fontSize='11.5px'
						fontWeight={active ? '600' : '500'}
						cursor={disabled ? 'not-allowed' : 'pointer'}
						opacity={disabled ? 0.4 : 1}
						transition='color .12s ease, background-color .12s ease'
						_hover={
							active || disabled
								? undefined
								: { bg: 'color-mix(in srgb, var(--beak-colors-accent-pink) 10%, transparent)', color: 'fg.default' }
						}
						_focusVisible={{
							outline: 'none',
							boxShadow: '0 0 0 2px color-mix(in srgb, var(--beak-colors-accent-pink) 30%, transparent)',
						}}
					>
						<opt.Icon size={11} strokeWidth={2} />
						<Box as='span'>{opt.label}</Box>
					</ChakraButton>
				);
			})}
		</Flex>
	);
};

const PasteArea: React.FC<{ value: string; onChange: (v: string) => void; accentVar: string }> = ({
	value,
	onChange,
	accentVar,
}) => {
	const ChakraTextarea = chakra('textarea');
	return (
		<ChakraTextarea
			value={value}
			onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => onChange(e.currentTarget.value)}
			placeholder='Paste OpenAPI 3.x YAML or JSON here…'
			w='100%'
			minH='160px'
			p='2.5'
			fontSize='12px'
			fontFamily='mono'
			color='fg.default'
			bg='bg.canvas'
			borderRadius='md'
			borderWidth='1px'
			borderColor='border.subtle'
			outline='none'
			resize='vertical'
			transition='border-color .12s ease, box-shadow .12s ease'
			_placeholder={{ color: 'fg.subtle' }}
			style={{ caretColor: accentVar }}
			_hover={{ borderColor: 'border.emphasized' }}
			_focus={{
				borderColor: 'transparent',
				boxShadow: `inset 0 0 0 1px ${accentVar}, 0 0 0 3px color-mix(in srgb, ${accentVar} 18%, transparent)`,
			}}
		/>
	);
};

/**
 * "Derive folder name from endpoint URL" checkbox shared by the graphql /
 * gRPC create branches. The OpenAPI dialog has its own auto-naming story
 * (the spec carries an `info.title`) so it doesn't reuse this control.
 */
const DeriveFromUrlToggle: React.FC<{ checked: boolean; onChange: (next: boolean) => void }> = ({
	checked,
	onChange,
}) => (
	<Flex
		as='label'
		align='flex-start'
		gap='2'
		cursor='pointer'
		fontSize='xs'
		color='fg.muted'
		px='1'
		borderRadius='md'
		_hover={{ color: 'fg.default' }}
	>
		<input
			type='checkbox'
			checked={checked}
			onChange={e => onChange(e.currentTarget.checked)}
			style={{ marginTop: '2px' }}
		/>
		<Box>
			<Box fontWeight='600' color='fg.default'>
				{'Derive folder name from endpoint URL'}
			</Box>
			<Box fontSize='10px' color='fg.subtle' mt='0.5'>
				{'Use the URL host as the folder name — '}
				<Box as='span' fontFamily='mono'>
					{'api.example.com'}
				</Box>
				{' lands under '}
				<Box as='span' fontFamily='mono'>
					{'api-example-com/'}
				</Box>
				{'.'}
			</Box>
		</Box>
	</Flex>
);

/**
 * Footer-style chip rendering the resolved save target — `project root`
 * when the folder name is blank, `<name>/` otherwise. Shared between the
 * three create branches so they all preview the same shape.
 */
const SavesToChip: React.FC<{ preview: string; accentToken: string }> = ({ preview, accentToken }) => (
	<Flex
		align='center'
		gap='2'
		px='2.5'
		py='1.5'
		borderRadius='md'
		borderWidth='1px'
		borderColor='border.subtle'
		bg='bg.canvas'
		fontSize='xs'
	>
		<Box color='fg.subtle' flex='0 0 auto'>
			<Folder size={11} strokeWidth={2} />
		</Box>
		<Box color='fg.subtle' fontSize='10px' fontWeight='700' textTransform='uppercase' letterSpacing='0.06em'>
			{'Saves to'}
		</Box>
		<Box
			flex='1 1 auto'
			minW={0}
			fontFamily='mono'
			color='fg.default'
			overflow='hidden'
			textOverflow='ellipsis'
			whiteSpace='nowrap'
		>
			<Box as='span' color={accentToken} fontWeight='500'>
				{preview}
			</Box>
		</Box>
	</Flex>
);

/**
 * Inline amber banner shown when the user is about to drop a source at the
 * project root that already carries a non-manual source. Multiple sources
 * are fine across the tree; only the root is single-occupancy, so this is
 * the one place we surface an override warning.
 */
const RootOverrideWarning: React.FC<{ message: string }> = ({ message }) => (
	<Flex
		align='flex-start'
		gap='2'
		px='2.5'
		py='1.5'
		borderRadius='md'
		borderWidth='1px'
		borderColor='color-mix(in srgb, var(--beak-colors-accent-warning) 38%, var(--beak-colors-border-subtle))'
		bg='color-mix(in srgb, var(--beak-colors-accent-warning) 10%, var(--beak-colors-bg-surface))'
		fontSize='xs'
		color='fg.default'
	>
		<Box color='accent.warning' flex='0 0 auto' mt='0.5'>
			<AlertTriangle size={12} />
		</Box>
		<Box>{message}</Box>
	</Flex>
);

function buildRootWarning(
	rootSource: CollectionSource | null,
	kind: SourceSchemaKind,
	isDroppingAtRoot: boolean,
): string | null {
	if (!isDroppingAtRoot || !rootSource || rootSource.type === 'manual') return null;
	if (rootSource.type === kind)
		return `An existing ${kind} source is registered at the project root — saving will replace it.`;
	return `This will replace the existing ${rootSource.type} source at the project root.`;
}

export default SourceSchemaDialog;
