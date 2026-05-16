import { Box, Flex } from '@chakra-ui/react';
import Button from '@beak/ui/components/atoms/Button';
import Input from '@beak/ui/components/atoms/Input';
import {
	enumerateOpenApiSources,
	type OpenApiSourceEntry,
} from '@beak/ui/features/project-home/lib/enumerate-sources';
import { syncFromUrl } from '@beak/ui/features/project-home/lib/sync-from-url';
import { updateSyncConfig } from '@beak/ui/features/project-home/lib/update-sync-config';
import { useAppSelector } from '@beak/ui/store/redux';
import { AlertOctagon, CheckCircle2, Globe, Home, Plus, RefreshCw, Trash2 } from 'lucide-react';
import * as React from 'react';
import { useCallback, useEffect, useState } from 'react';

import { ipcFsService } from '../lib/ipc';

interface RowState {
	syncing: boolean;
	lastResult?: { ok: true; notice: string } | { ok: false; error: string };
}

const DEFAULT_INTERVAL = 60;

const ProjectHome: React.FC = () => {
	const projectName = useAppSelector(s => s.global.project.name) ?? 'Project';
	const projectFolderPath = useAppSelector(s => s.global.project.folderPath) ?? '';
	const isMemory = useAppSelector(s => s.global.project.mode === 'memory');
	const tree = useAppSelector(s => s.global.project.tree);

	const [entries, setEntries] = useState<OpenApiSourceEntry[]>([]);
	const [loading, setLoading] = useState(true);
	const [rowState, setRowState] = useState<Record<string, RowState>>({});

	const reload = useCallback(async () => {
		setLoading(true);
		try {
			const list = await enumerateOpenApiSources(tree, projectFolderPath);
			setEntries(list);
		} finally {
			setLoading(false);
		}
	}, [tree, projectFolderPath]);

	useEffect(() => {
		void reload();
	}, [reload]);

	function setRow(folderPath: string, patch: Partial<RowState>) {
		setRowState(prev => ({ ...prev, [folderPath]: { ...prev[folderPath], syncing: false, ...patch } }));
	}

	async function syncRow(entry: OpenApiSourceEntry) {
		if (!entry.source.specUrl) {
			setRow(entry.folderPath, { lastResult: { ok: false, error: 'No URL on this source — re-import to set one.' } });
			return;
		}
		setRow(entry.folderPath, { syncing: true, lastResult: undefined });
		const outcome = await syncFromUrl({
			targetFolder: entry.relativeFolder,
			url: entry.source.specUrl,
			autoSync: entry.source.autoSync,
			intervalMinutes: entry.source.intervalMinutes,
		});
		if (outcome.ok) {
			const r = outcome.result;
			const parts: string[] = [];
			if (r.requestPaths.length > 0) parts.push(`${r.requestPaths.length} request${r.requestPaths.length === 1 ? '' : 's'}`);
			if (r.overwritten.length > 0) parts.push(`${r.overwritten.length} overwritten`);
			if (r.warnings.length > 0) parts.push(`${r.warnings.length} warning${r.warnings.length === 1 ? '' : 's'}`);
			setRow(entry.folderPath, { lastResult: { ok: true, notice: parts.join(' · ') || 'Up to date' } });
			await reload();
		} else {
			setRow(entry.folderPath, { lastResult: { ok: false, error: outcome.error } });
		}
	}

	async function toggleAutoSync(entry: OpenApiSourceEntry, nextValue: boolean) {
		await updateSyncConfig({
			folderPath: entry.folderPath,
			autoSync: nextValue,
			intervalMinutes: entry.source.intervalMinutes ?? DEFAULT_INTERVAL,
		});
		await reload();
	}

	async function changeInterval(entry: OpenApiSourceEntry, nextMinutes: number) {
		if (!Number.isFinite(nextMinutes) || nextMinutes < 1) return;
		await updateSyncConfig({
			folderPath: entry.folderPath,
			intervalMinutes: Math.floor(nextMinutes),
		});
		await reload();
	}

	async function removeSource(entry: OpenApiSourceEntry) {
		const collectionPath = `${entry.folderPath}/_collection.json`;
		if (!(await ipcFsService.pathExists(collectionPath))) {
			await reload();
			return;
		}
		await ipcFsService.remove(collectionPath);
		await reload();
	}

	return (
		<Box h='100%' overflowY='auto' bg='bg.canvas'>
			<Box maxW='820px' mx='auto' px='8' pt='9' pb='12'>
				<Flex align='center' gap='3' mb='1'>
					<Flex
						align='center'
						justify='center'
						w='38px'
						h='38px'
						borderRadius='full'
						bg='color-mix(in srgb, var(--beak-colors-accent-teal) 14%, transparent)'
						borderWidth='1px'
						borderColor='color-mix(in srgb, var(--beak-colors-accent-teal) 26%, transparent)'
						color='accent.teal'
						boxShadow='0 4px 12px color-mix(in srgb, var(--beak-colors-accent-teal) 22%, transparent), inset 0 1px 0 color-mix(in srgb, white 14%, transparent)'
					>
						<Home size={18} strokeWidth={2} />
					</Flex>
					<Box>
						<Box fontSize='3xl' fontWeight='700' letterSpacing='-0.02em' lineHeight='1.05' color='fg.default'>
							{projectName}
						</Box>
						{isMemory && (
							<Box fontSize='10px' color='accent.pink' fontWeight='700' letterSpacing='0.06em' textTransform='uppercase'>
								{'Untitled project'}
							</Box>
						)}
					</Box>
				</Flex>
				<Box fontSize='sm' color='fg.subtle' mt='1' mb='5'>
					{'Project-level controls. OpenAPI sync sources live here.'}
				</Box>

				<Box
					h='1px'
					mb='6'
					bg='linear-gradient(to right, color-mix(in srgb, var(--beak-colors-accent-teal) 30%, transparent), color-mix(in srgb, var(--beak-colors-border-default) 55%, transparent) 30%, transparent 100%)'
				/>

				<OpenApiSourcesSection
					entries={entries}
					loading={loading}
					rowState={rowState}
					onSync={syncRow}
					onToggleAutoSync={toggleAutoSync}
					onChangeInterval={changeInterval}
					onRemove={removeSource}
					onAdded={reload}
				/>
			</Box>
		</Box>
	);
};

interface OpenApiSourcesSectionProps {
	entries: OpenApiSourceEntry[];
	loading: boolean;
	rowState: Record<string, RowState>;
	onSync: (entry: OpenApiSourceEntry) => void;
	onToggleAutoSync: (entry: OpenApiSourceEntry, nextValue: boolean) => void;
	onChangeInterval: (entry: OpenApiSourceEntry, nextMinutes: number) => void;
	onRemove: (entry: OpenApiSourceEntry) => void;
	onAdded: () => Promise<void>;
}

const OpenApiSourcesSection: React.FC<OpenApiSourcesSectionProps> = ({
	entries,
	loading,
	rowState,
	onSync,
	onToggleAutoSync,
	onChangeInterval,
	onRemove,
	onAdded,
}) => {
	const [adding, setAdding] = useState(false);

	return (
		<Box>
			<Flex align='center' gap='2' mb='3'>
				<Box fontSize='md' fontWeight='600' color='fg.default'>{'OpenAPI Sources'}</Box>
				<Box flex='1' />
				<Button size='sm' colour='secondary' onClick={() => setAdding(v => !v)}>
					<Flex align='center' gap='1.5'>
						<Plus size={12} />
						{adding ? 'Cancel' : 'Add URL source'}
					</Flex>
				</Button>
			</Flex>

			{adding && <AddSourceForm onClose={() => setAdding(false)} onAdded={onAdded} />}

			{loading && entries.length === 0 && (
				<Box fontSize='xs' color='fg.subtle' fontFamily='mono'>{'Loading…'}</Box>
			)}

			{!loading && entries.length === 0 && !adding && (
				<Box
					p='5'
					textAlign='center'
					borderWidth='1px'
					borderStyle='dashed'
					borderColor='border.subtle'
					borderRadius='md'
					bg='bg.surface'
					color='fg.subtle'
					fontSize='sm'
				>
					{'No OpenAPI sync sources yet. Add one to keep a collection in lockstep with a remote spec.'}
				</Box>
			)}

			<Flex direction='column' gap='3'>
				{entries.map(entry => (
					<SourceRow
						key={entry.folderPath}
						entry={entry}
						state={rowState[entry.folderPath]}
						onSync={onSync}
						onToggleAutoSync={onToggleAutoSync}
						onChangeInterval={onChangeInterval}
						onRemove={onRemove}
					/>
				))}
			</Flex>
		</Box>
	);
};

interface SourceRowProps {
	entry: OpenApiSourceEntry;
	state?: RowState;
	onSync: (entry: OpenApiSourceEntry) => void;
	onToggleAutoSync: (entry: OpenApiSourceEntry, nextValue: boolean) => void;
	onChangeInterval: (entry: OpenApiSourceEntry, nextMinutes: number) => void;
	onRemove: (entry: OpenApiSourceEntry) => void;
}

const SourceRow: React.FC<SourceRowProps> = ({ entry, state, onSync, onToggleAutoSync, onChangeInterval, onRemove }) => {
	const { source } = entry;
	const [intervalDraft, setIntervalDraft] = useState(String(source.intervalMinutes ?? DEFAULT_INTERVAL));

	useEffect(() => {
		setIntervalDraft(String(source.intervalMinutes ?? DEFAULT_INTERVAL));
	}, [source.intervalMinutes]);

	return (
		<Box
			borderWidth='1px'
			borderColor='border.subtle'
			borderRadius='md'
			bg='bg.surface'
			p='3.5'
			boxShadow='inset 0 1px 0 color-mix(in srgb, white 10%, transparent)'
		>
			<Flex align='flex-start' gap='3'>
				<Flex
					align='center'
					justify='center'
					w='28px'
					h='28px'
					flexShrink={0}
					borderRadius='sm'
					bg='color-mix(in srgb, var(--beak-colors-accent-pink) 14%, transparent)'
					borderWidth='1px'
					borderColor='color-mix(in srgb, var(--beak-colors-accent-pink) 26%, transparent)'
					color='accent.pink'
				>
					<Globe size={14} strokeWidth={2} />
				</Flex>
				<Flex direction='column' flex='1' minW={0} gap='1'>
					<Box fontFamily='mono' fontSize='sm' color='fg.default' overflow='hidden' textOverflow='ellipsis' whiteSpace='nowrap'>
						{entry.relativeFolder}
					</Box>
					<Box fontFamily='mono' fontSize='xs' color='fg.muted' overflow='hidden' textOverflow='ellipsis' whiteSpace='nowrap'>
						{source.specUrl ?? source.specPath ?? '(no source)'}
					</Box>
					<Box fontSize='10px' color='fg.subtle' fontWeight='700' letterSpacing='0.04em' textTransform='uppercase'>
						{source.lastSyncedAt
							? `Last synced ${formatRelative(source.lastSyncedAt)}`
							: 'Never synced'}
					</Box>
				</Flex>
				<Flex direction='column' gap='1.5' align='flex-end' flexShrink={0}>
					<Button
						size='sm'
						colour='secondary'
						onClick={() => onSync(entry)}
						disabled={state?.syncing || !source.specUrl}
					>
						<Flex align='center' gap='1.5'>
							<RefreshCw size={12} className={state?.syncing ? 'animate-spin' : undefined} />
							{state?.syncing ? 'Syncing…' : 'Sync now'}
						</Flex>
					</Button>
					<Button
						size='sm'
						colour='secondary'
						onClick={() => onRemove(entry)}
					>
						<Flex align='center' gap='1.5'>
							<Trash2 size={12} />
							{'Remove'}
						</Flex>
					</Button>
				</Flex>
			</Flex>

			<Flex align='center' gap='4' mt='3' wrap='wrap'>
				<Flex as='label' align='center' gap='1.5' cursor='pointer' fontSize='xs' color='fg.muted'>
					<input
						type='checkbox'
						checked={Boolean(source.autoSync)}
						disabled={!source.specUrl}
						onChange={e => onToggleAutoSync(entry, e.currentTarget.checked)}
					/>
					{'Keep in sync automatically'}
				</Flex>
				<Flex align='center' gap='1.5' fontSize='xs' color='fg.muted'>
					{'Every'}
					<Input
						$beakSize='sm'
						value={intervalDraft}
						onChange={e => setIntervalDraft(e.currentTarget.value)}
						onBlur={() => {
							const n = Number(intervalDraft);
							if (Number.isFinite(n) && n >= 1) onChangeInterval(entry, n);
							else setIntervalDraft(String(source.intervalMinutes ?? DEFAULT_INTERVAL));
						}}
						style={{ width: '64px', textAlign: 'right' }}
						inputMode='numeric'
						disabled={!source.autoSync}
					/>
					{'minutes'}
				</Flex>
			</Flex>

			{state?.lastResult && (
				<Box mt='3'>
					{state.lastResult.ok ? (
						<Flex align='center' gap='1.5' color='accent.teal' fontSize='xs'>
							<CheckCircle2 size={12} />
							<Box color='fg.default'>{state.lastResult.notice}</Box>
						</Flex>
					) : (
						<Flex align='center' gap='1.5' color='accent.alert' fontSize='xs'>
							<AlertOctagon size={12} />
							<Box color='fg.default'>{state.lastResult.error}</Box>
						</Flex>
					)}
				</Box>
			)}
		</Box>
	);
};

interface AddSourceFormProps {
	onClose: () => void;
	onAdded: () => Promise<void>;
}

const AddSourceForm: React.FC<AddSourceFormProps> = ({ onClose, onAdded }) => {
	const [url, setUrl] = useState('');
	const [folder, setFolder] = useState('tree/openapi');
	const [autoSync, setAutoSync] = useState(true);
	const [intervalMinutes, setIntervalMinutes] = useState('60');
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState<string | null>(null);

	async function submit() {
		setError(null);
		const trimmedUrl = url.trim();
		if (!trimmedUrl) {
			setError('Enter a URL.');
			return;
		}
		const trimmedFolder = folder.trim();
		const normalised = trimmedFolder.startsWith('tree/') ? trimmedFolder : `tree/${trimmedFolder.replace(/^\/+/, '')}`;
		const n = Number(intervalMinutes);
		const minutes = Number.isFinite(n) && n >= 1 ? Math.floor(n) : 60;

		setBusy(true);
		const outcome = await syncFromUrl({
			targetFolder: normalised,
			url: trimmedUrl,
			autoSync,
			intervalMinutes: minutes,
		});
		setBusy(false);
		if (outcome.ok) {
			await onAdded();
			onClose();
		} else {
			setError(outcome.error);
		}
	}

	return (
		<Box
			mb='4'
			p='3.5'
			borderWidth='1px'
			borderColor='border.subtle'
			borderRadius='md'
			bg='bg.surface'
		>
			<Box fontSize='xs' fontWeight='700' color='accent.teal' letterSpacing='0.06em' textTransform='uppercase' mb='2'>
				{'New OpenAPI sync source'}
			</Box>
			<Flex direction='column' gap='2'>
				<Flex direction='column' gap='1'>
					<Box fontSize='10px' fontWeight='700' textTransform='uppercase' letterSpacing='0.06em' color='fg.subtle'>
						{'Spec URL'}
					</Box>
					<Input
						$beakSize='md'
						value={url}
						placeholder='https://example.com/openapi.yaml'
						onChange={e => setUrl(e.currentTarget.value)}
					/>
				</Flex>
				<Flex direction='column' gap='1'>
					<Box fontSize='10px' fontWeight='700' textTransform='uppercase' letterSpacing='0.06em' color='fg.subtle'>
						{'Target folder'}
					</Box>
					<Input
						$beakSize='md'
						value={folder}
						placeholder='tree/openapi'
						onChange={e => setFolder(e.currentTarget.value)}
					/>
				</Flex>
				<Flex align='center' gap='3' wrap='wrap'>
					<Flex as='label' align='center' gap='1.5' cursor='pointer' fontSize='xs' color='fg.muted'>
						<input
							type='checkbox'
							checked={autoSync}
							onChange={e => setAutoSync(e.currentTarget.checked)}
						/>
						{'Auto-sync after import'}
					</Flex>
					<Flex align='center' gap='1.5' fontSize='xs' color='fg.muted'>
						{'Every'}
						<Input
							$beakSize='sm'
							value={intervalMinutes}
							onChange={e => setIntervalMinutes(e.currentTarget.value)}
							style={{ width: '64px', textAlign: 'right' }}
							inputMode='numeric'
							disabled={!autoSync}
						/>
						{'minutes'}
					</Flex>
				</Flex>
				{error && (
					<Flex align='center' gap='1.5' color='accent.alert' fontSize='xs'>
						<AlertOctagon size={12} />
						<Box color='fg.default'>{error}</Box>
					</Flex>
				)}
				<Flex justify='flex-end' gap='2' mt='1'>
					<Button size='sm' colour='secondary' onClick={onClose} disabled={busy}>{'Cancel'}</Button>
					<Button size='sm' onClick={submit} disabled={busy}>
						{busy ? 'Adding…' : 'Add and sync'}
					</Button>
				</Flex>
			</Flex>
		</Box>
	);
};

function formatRelative(iso: string): string {
	const then = new Date(iso).getTime();
	if (!Number.isFinite(then)) return iso;
	const seconds = Math.max(0, Math.round((Date.now() - then) / 1000));
	if (seconds < 60) return `${seconds}s ago`;
	const minutes = Math.round(seconds / 60);
	if (minutes < 60) return `${minutes}m ago`;
	const hours = Math.round(minutes / 60);
	if (hours < 24) return `${hours}h ago`;
	const days = Math.round(hours / 24);
	return `${days}d ago`;
}

export default ProjectHome;
