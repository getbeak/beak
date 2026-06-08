import type {
	ExtensionOperation,
	ExtensionSearchResult,
	FailedExtension,
	LoadedExtension,
} from '@beak/common/types/extensions';
import type Squawk from '@beak/common/utils/squawk';
import {
	checkExtensionUpdates,
	installExtension,
	removeExtension,
	searchExtensions,
	selectExtensionOperation,
	selectExtensionSearch,
	selectExtensions,
	selectExtensionUpdate,
	updateExtension,
} from '@beak/state/extensions';
import { ipcExplorerService } from '@beak/ui/lib/ipc';
import { useAppDispatch, useAppSelector } from '@beak/ui/store/redux';
import { Box, Button, Flex, Input } from '@chakra-ui/react';
import { ChevronDown, ChevronUp, Download, Loader2, Package, Puzzle, RefreshCw, Search, Trash2 } from 'lucide-react';
import * as React from 'react';
import { useEffect, useMemo, useState } from 'react';

import SidebarPane from '../../sidebar/components/SidebarPane';
import SidebarPaneSection from '../../sidebar/components/SidebarPaneSection';

const ExtensionsPane: React.FC = () => {
	const dispatch = useAppDispatch();
	const extensions = useAppSelector(selectExtensions);

	useEffect(() => {
		// startExtensions() is already dispatched by use-project-bootstrap on
		// project open — re-dispatching here would rebuild every isolate/worker
		// on every sidebar visit. Just refresh the update map.
		dispatch(checkExtensionUpdates());
	}, [dispatch]);

	const [loaded, failed] = useMemo(() => {
		const ok: LoadedExtension[] = [];
		const bad: FailedExtension[] = [];
		for (const ext of extensions) {
			if (ext.status === 'loaded') ok.push(ext);
			else bad.push(ext);
		}
		return [ok, bad] as const;
	}, [extensions]);

	return (
		<SidebarPane>
			<SidebarPaneSection title='Install' collapseKey='beak.extensions.install'>
				<InstallForm />
			</SidebarPaneSection>

			<SidebarPaneSection
				title={loaded.length > 0 ? `Installed (${loaded.length})` : 'Installed'}
				collapseKey='beak.extensions.installed'
			>
				{loaded.length === 0 && failed.length === 0 ? (
					<EmptyState />
				) : (
					<Box>
						{loaded.map(ext => (
							<LoadedRow key={ext.packageName} extension={ext} />
						))}
					</Box>
				)}
			</SidebarPaneSection>

			{failed.length > 0 && (
				<SidebarPaneSection title={`Failed (${failed.length})`} collapseKey='beak.extensions.failed'>
					<Box>
						{failed.map(ext => (
							<FailedRow key={ext.packageName} extension={ext} />
						))}
					</Box>
				</SidebarPaneSection>
			)}
		</SidebarPane>
	);
};

export default ExtensionsPane;

/* -------------------------------------------------------------------------- */
/*  Empty state                                                               */
/* -------------------------------------------------------------------------- */

const EmptyState: React.FC = () => (
	<Box px='3' py='4' fontSize='xs' color='fg.subtle' lineHeight='1.6'>
		{'No extensions installed. Search above to find one — try the package name of any Beak extension.'}
	</Box>
);

/* -------------------------------------------------------------------------- */
/*  Install form                                                              */
/* -------------------------------------------------------------------------- */

const InstallForm: React.FC = () => {
	const dispatch = useAppDispatch();
	const search = useAppSelector(selectExtensionSearch);
	const [focused, setFocused] = useState(false);

	const onQueryChange = (next: string) => {
		dispatch(searchExtensions({ query: next }));
	};

	const handleInstall = (packageName: string, versionRange?: string) => {
		dispatch(installExtension({ packageName, versionRange }));
	};

	return (
		<Box px='3' py='2'>
			<Box position='relative'>
				<Flex
					align='center'
					gap='2'
					px='2'
					py='1.5'
					bg='bg.subtle'
					borderRadius='md'
					borderWidth='1px'
					borderColor='border.subtle'
					_focusWithin={{
						borderColor: 'accent.pink',
						boxShadow: '0 0 0 2px color-mix(in srgb, var(--beak-colors-accent-pink) 24%, transparent)',
					}}
				>
					<Search size={12} color='var(--beak-colors-fg-subtle)' />
					<Input
						placeholder='Search npm'
						value={search.query}
						onChange={e => onQueryChange(e.currentTarget.value)}
						onFocus={() => setFocused(true)}
						onBlur={() => setTimeout(() => setFocused(false), 150)}
						onKeyDown={e => {
							if (e.key === 'Enter' && search.query.trim()) handleInstall(search.query.trim());
						}}
						autoComplete='off'
						variant='outline'
						border='none'
						p='0'
						h='auto'
						fontSize='xs'
						bg='transparent'
						_focus={{ boxShadow: 'none', outline: 'none' }}
						_focusVisible={{ boxShadow: 'none', outline: 'none' }}
					/>
				</Flex>

				{focused && (search.loading || search.results.length > 0) && (
					<Box
						position='absolute'
						top='calc(100% + 4px)'
						left='0'
						right='0'
						zIndex='2'
						bg='bg.surface'
						borderWidth='1px'
						borderColor='border.subtle'
						borderRadius='md'
						overflow='hidden'
						boxShadow='0 10px 28px color-mix(in srgb, var(--beak-colors-gray-950) 18%, transparent)'
						maxH='320px'
						overflowY='auto'
					>
						{search.loading && search.results.length === 0 && (
							<Box px='2.5' py='2' fontSize='xs' color='fg.subtle'>
								{'Searching…'}
							</Box>
						)}
						{search.results.map(hit => (
							<SearchHit key={hit.packageName} hit={hit} onInstall={handleInstall} />
						))}
						{!search.loading && search.results.length === 0 && search.query.trim() && (
							<Box px='2.5' py='2' fontSize='xs' color='fg.subtle'>
								{'No matches — press ↵ to install '}
								<Box as='span' fontFamily='mono' color='fg.default'>
									{search.query.trim()}
								</Box>
								{' anyway.'}
							</Box>
						)}
					</Box>
				)}
			</Box>
		</Box>
	);
};

const SearchHit: React.FC<{
	hit: ExtensionSearchResult;
	onInstall: (packageName: string, version?: string) => void;
}> = ({ hit, onInstall }) => (
	<Flex
		align='center'
		gap='2'
		px='2.5'
		py='2'
		borderBottomWidth='1px'
		borderBottomColor='border.subtle'
		css={{ '&:last-of-type': { borderBottomWidth: 0 } }}
		_hover={{ bg: 'bg.subtle' }}
	>
		<Box flex='1 1 auto' minW={0}>
			<Flex align='baseline' gap='1.5'>
				<Box fontSize='xs' fontWeight='600' color='fg.default' fontFamily='mono' truncate>
					{hit.packageName}
				</Box>
				<Box fontSize='10px' color='fg.subtle' fontFamily='mono'>
					{hit.version}
				</Box>
			</Flex>
			{hit.description && (
				<Box fontSize='10px' color='fg.muted' truncate>
					{hit.description}
				</Box>
			)}
		</Box>
		<Button size='xs' variant='subtle' colorPalette='pink' onClick={() => onInstall(hit.packageName)}>
			<Download size={10} strokeWidth={2} />
		</Button>
	</Flex>
);

/* -------------------------------------------------------------------------- */
/*  Loaded extension row                                                      */
/* -------------------------------------------------------------------------- */

const LoadedRow: React.FC<{ extension: LoadedExtension }> = ({ extension }) => {
	const dispatch = useAppDispatch();
	const operation = useAppSelector(s => selectExtensionOperation(s, extension.packageName));
	const update = useAppSelector(s => selectExtensionUpdate(s, extension.packageName));
	const [expanded, setExpanded] = useState(false);

	const busy = Boolean(operation && operation.status !== 'failed');

	return (
		<Box borderBottomWidth='1px' borderBottomColor='border.subtle' css={{ '&:last-of-type': { borderBottomWidth: 0 } }}>
			<Flex align='center' gap='2' px='3' py='2'>
				<Flex
					align='center'
					justify='center'
					w='22px'
					h='22px'
					borderRadius='sm'
					bg='color-mix(in srgb, var(--beak-colors-accent-pink) 14%, transparent)'
					color='accent.pink'
					flex='0 0 auto'
				>
					<Puzzle size={11} strokeWidth={2} />
				</Flex>
				<Box flex='1 1 auto' minW={0}>
					<Flex align='baseline' gap='1.5' minW={0}>
						<Box fontSize='xs' fontWeight='600' color='fg.default' letterSpacing='-0.005em' truncate>
							{extension.displayName}
						</Box>
						<Box fontSize='10px' color='fg.subtle' fontFamily='mono'>
							{`v${extension.version}`}
						</Box>
					</Flex>
					{update && (
						<Box fontSize='10px' color='accent.teal' fontWeight='600'>
							{`Update → ${update.latestVersion}`}
						</Box>
					)}
					{!update && extension.description && (
						<Box fontSize='10px' color='fg.muted' truncate>
							{extension.description}
						</Box>
					)}
				</Box>

				<Flex gap='0.5' flex='0 0 auto'>
					{update && (
						<Button
							size='xs'
							variant='ghost'
							colorPalette='teal'
							disabled={busy}
							onClick={() => dispatch(updateExtension({ packageName: extension.packageName }))}
							aria-label='Update extension'
							title='Update'
							p='0'
							minW='22px'
							h='22px'
						>
							{busy && operation?.kind === 'update' ? (
								<Loader2 size={11} className='animate-spin' />
							) : (
								<RefreshCw size={11} strokeWidth={2} />
							)}
						</Button>
					)}
					<Button
						size='xs'
						variant='ghost'
						disabled={busy}
						onClick={() => dispatch(removeExtension({ packageName: extension.packageName }))}
						aria-label='Remove extension'
						title='Remove'
						p='0'
						minW='22px'
						h='22px'
					>
						{busy && operation?.kind === 'remove' ? (
							<Loader2 size={11} className='animate-spin' />
						) : (
							<Trash2 size={11} strokeWidth={2} />
						)}
					</Button>
					<Button
						size='xs'
						variant='ghost'
						onClick={() => setExpanded(v => !v)}
						aria-label={expanded ? 'Collapse details' : 'Expand details'}
						p='0'
						minW='22px'
						h='22px'
					>
						{expanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
					</Button>
				</Flex>
			</Flex>

			{expanded && <LoadedDetails extension={extension} />}
			{operation?.status === 'failed' && operation.error && (
				<OperationError kind={operation.kind} error={operation.error} />
			)}
		</Box>
	);
};

const LoadedDetails: React.FC<{ extension: LoadedExtension }> = ({ extension }) => (
	<Box
		px='3'
		pb='2.5'
		pt='1'
		fontSize='10px'
		color='fg.muted'
		bg='color-mix(in srgb, var(--beak-colors-bg-surface) 50%, transparent)'
	>
		<DetailRow label='Package'>
			<Box fontFamily='mono' color='fg.default' truncate>
				{extension.packageName}
			</Box>
		</DetailRow>
		{extension.author && (
			<DetailRow label='Author'>
				<Box color='fg.default'>{extension.author}</Box>
			</DetailRow>
		)}
		{extension.homepage && (
			<DetailRow label='Home'>
				<a
					href={extension.homepage}
					target='_blank'
					rel='noreferrer'
					style={{
						color: 'var(--beak-colors-accent-pink)',
						textDecoration: 'underline',
						textDecorationStyle: 'dotted',
					}}
				>
					{extension.homepage.replace(/^https?:\/\//, '')}
				</a>
			</DetailRow>
		)}
		<DetailRow label='Folder'>
			<Button
				variant='plain'
				p='0'
				h='auto'
				minH='unset'
				fontSize='10px'
				fontFamily='mono'
				color='accent.pink'
				textDecoration='underline'
				textDecorationStyle='dotted'
				_hover={{ textDecorationStyle: 'solid' }}
				onClick={() => ipcExplorerService.revealFile(extension.filePath)}
			>
				{'reveal'}
			</Button>
		</DetailRow>
		<DetailRow label={`Variables (${extension.variables.length})`}>
			<Flex direction='column' gap='0.5' align='flex-end'>
				{extension.variables.map(v => (
					<Flex key={v.type} align='center' gap='1'>
						<Box fontFamily='mono' color='fg.default' fontSize='10px'>
							{v.variableId}
						</Box>
						{v.editable && <FeatureChip label='editor' />}
						{v.sensitive && <FeatureChip label='sensitive' tone='alert' />}
					</Flex>
				))}
			</Flex>
		</DetailRow>
	</Box>
);

const DetailRow: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
	<Flex justify='space-between' align='flex-start' gap='2' py='0.5'>
		<Box
			fontSize='9px'
			fontWeight='700'
			textTransform='uppercase'
			letterSpacing='0.06em'
			color='fg.subtle'
			flex='0 0 auto'
		>
			{label}
		</Box>
		<Box flex='0 1 auto' textAlign='right' minW={0} maxW='75%'>
			{children}
		</Box>
	</Flex>
);

const FeatureChip: React.FC<{ label: string; tone?: 'pink' | 'teal' | 'indigo' | 'alert' }> = ({
	label,
	tone = 'indigo',
}) => (
	<Box
		fontSize='8px'
		fontWeight='700'
		textTransform='uppercase'
		letterSpacing='0.06em'
		px='1'
		py='0.5'
		borderRadius='sm'
		bg={`color-mix(in srgb, var(--beak-colors-accent-${tone}) 14%, transparent)`}
		color={`accent.${tone}`}
	>
		{label}
	</Box>
);

/* -------------------------------------------------------------------------- */
/*  Failed extension row                                                      */
/* -------------------------------------------------------------------------- */

const FailedRow: React.FC<{ extension: FailedExtension }> = ({ extension }) => {
	const dispatch = useAppDispatch();

	return (
		<Flex
			align='center'
			gap='2'
			px='3'
			py='2'
			borderBottomWidth='1px'
			borderBottomColor='border.subtle'
			css={{ '&:last-of-type': { borderBottomWidth: 0 } }}
		>
			<Flex
				align='center'
				justify='center'
				w='22px'
				h='22px'
				borderRadius='sm'
				bg='color-mix(in srgb, var(--beak-colors-accent-alert) 14%, transparent)'
				color='accent.alert'
				flex='0 0 auto'
			>
				<Package size={11} strokeWidth={2} />
			</Flex>
			<Box flex='1 1 auto' minW={0}>
				<Box fontSize='xs' fontWeight='600' color='fg.default' truncate>
					{extension.packageName}
				</Box>
				<Box fontSize='10px' color='accent.alert' truncate>
					{extension.error?.code ?? 'failed_to_load'}
				</Box>
			</Box>
			<Button
				size='xs'
				variant='ghost'
				onClick={() => dispatch(removeExtension({ packageName: extension.packageName }))}
				aria-label='Remove extension'
				p='0'
				minW='22px'
				h='22px'
			>
				<Trash2 size={11} strokeWidth={2} />
			</Button>
		</Flex>
	);
};

/* -------------------------------------------------------------------------- */
/*  Operation error                                                           */
/* -------------------------------------------------------------------------- */

const OperationError: React.FC<{ kind: ExtensionOperation['kind']; error: Squawk }> = ({ kind, error }) => (
	<Box
		mx='3'
		mb='2'
		p='2'
		borderRadius='md'
		bg='color-mix(in srgb, var(--beak-colors-accent-alert) 8%, transparent)'
		borderWidth='1px'
		borderColor='color-mix(in srgb, var(--beak-colors-accent-alert) 24%, transparent)'
		fontSize='10px'
		color='accent.alert'
	>
		<Box fontWeight='700' textTransform='uppercase' fontSize='9px' letterSpacing='0.06em' mb='0.5'>
			{`${kind} failed`}
		</Box>
		<Box color='fg.default' fontFamily='mono'>
			{error.code ?? 'unknown_error'}
		</Box>
	</Box>
);
