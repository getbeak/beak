import { verbToColor, verbToShortLabel } from '@beak/design-system/helpers';
import { projectTree } from '@beak/state';
import type { CollectionFile, CollectionSource } from '@beak/state/schemas';
import { loadCollectionAtFolder } from '@beak/ui/lib/beak-project/collection';
import { actions as projectActions } from '@beak/ui/store/project';
import { useAppSelector } from '@beak/ui/store/redux';
import { actions as workflowActions } from '@beak/ui/store/workflows';
import { Box, chakra, Flex, Input } from '@chakra-ui/react';
import type { FolderNode, Nodes, RequestNode } from '@getbeak/types/nodes';
import { ArrowUpRight, ChevronRight, Folder, FolderPlus, Pencil, Plus, Workflow as WorkflowIcon } from 'lucide-react';
import * as React from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';

import { changeTab } from '../../tabs/store/actions';

interface FolderOverviewProps {
	folderId: string;
}

const ChakraButton = chakra('button');

const FolderOverview: React.FC<FolderOverviewProps> = ({ folderId }) => {
	const dispatch = useDispatch();
	const node = useAppSelector(s => s.global.project.tree[folderId]);
	const tree = useAppSelector(s => s.global.project.tree);
	const workflows = useAppSelector(s => s.global.workflows.workflows);
	const mode = useAppSelector(s => s.global.project.mode);

	const breadcrumb = useMemo(() => buildBreadcrumb(folderId, tree), [folderId, tree]);
	const { folders, requests } = useMemo(() => groupChildren(folderId, tree), [folderId, tree]);
	const childWorkflows = useMemo(
		() =>
			Object.values(workflows)
				.filter(w => w.parent === folderId)
				.sort((a, b) => a.name.localeCompare(b.name)),
		[workflows, folderId],
	);

	const [collection, setCollection] = useState<CollectionFile | null>(null);
	const folderPath = node && node.type === 'folder' ? node.filePath : '';

	useEffect(() => {
		// Memory-mode projects have synthetic paths that aren't on disk yet —
		// skip the IPC call rather than dispatching a doomed fs read.
		if (!folderPath || mode !== 'disk') {
			setCollection(null);
			return;
		}

		let cancelled = false;
		loadCollectionAtFolder(folderPath)
			.then(loaded => {
				if (!cancelled) setCollection(loaded);
			})
			.catch(() => {
				if (!cancelled) setCollection(null);
			});

		return () => {
			cancelled = true;
		};
	}, [folderPath, mode]);

	const [editingName, setEditingName] = useState(false);
	const [nameDraft, setNameDraft] = useState('');
	const nameInputRef = useRef<HTMLInputElement | null>(null);

	function startNameEdit() {
		if (!node || node.type !== 'folder') return;
		setNameDraft(node.name);
		setEditingName(true);
	}

	function commitNameEdit() {
		setEditingName(false);
		if (!node || node.type !== 'folder') return;
		const next = nameDraft.trim();
		if (!next || next === node.name) return;
		// Reuse the existing rename pipeline — seed activeRename, push the new
		// name, submit. The project effect picks it up and renames on disk (or
		// in memory, for memory-mode projects).
		dispatch(projectActions.renameStarted({ requestId: folderId, name: node.name }));
		dispatch(projectActions.renameUpdated({ requestId: folderId, name: next }));
		dispatch(projectActions.renameSubmitted({ requestId: folderId }));
	}

	function cancelNameEdit() {
		setEditingName(false);
		if (node && node.type === 'folder') setNameDraft(node.name);
	}

	if (!node || node.type !== 'folder') {
		return (
			<Box h='100%' overflowY='auto' bg='bg.canvas'>
				<Box maxW='720px' mx='auto' px='8' pt='9' pb='12'>
					<Box fontSize='sm' color='fg.subtle'>
						{'This folder no longer exists.'}
					</Box>
				</Box>
			</Box>
		);
	}

	const totalChildren = folders.length + requests.length + childWorkflows.length;

	function openFolder(id: string) {
		dispatch(changeTab({ type: 'folder_overview', payload: id, temporary: true }));
	}

	function openRequest(id: string) {
		dispatch(changeTab({ type: 'request', payload: id, temporary: true }));
	}

	function openWorkflow(id: string) {
		dispatch(changeTab({ type: 'workflow_editor', payload: id, temporary: true }));
	}

	function newRequest() {
		dispatch(projectActions.createNewRequest({ highlightedNodeId: folderId }));
	}

	function newFolder() {
		dispatch(projectActions.createNewFolder({ highlightedNodeId: folderId }));
	}

	function newWorkflow() {
		dispatch(workflowActions.createNewWorkflow({ parent: folderId }));
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
						bg='color-mix(in srgb, var(--beak-colors-accent-indigo) 14%, transparent)'
						borderWidth='1px'
						borderColor='color-mix(in srgb, var(--beak-colors-accent-indigo) 26%, transparent)'
						color='accent.indigo'
						boxShadow='0 4px 12px color-mix(in srgb, var(--beak-colors-accent-indigo) 22%, transparent), inset 0 1px 0 color-mix(in srgb, white 14%, transparent)'
					>
						<Folder size={18} strokeWidth={2} />
					</Flex>
					<Box minW={0}>
						{breadcrumb.length > 1 && (
							<Flex align='center' gap='1' fontSize='11px' color='fg.subtle' mb='0.5'>
								{breadcrumb.slice(0, -1).map((segment, idx) => (
									<Flex key={segment.id} align='center' gap='1' minW={0}>
										{segment.id === 'root' ? (
											<Box as='span' color='fg.muted'>
												{segment.name}
											</Box>
										) : (
											<ChakraButton
												type='button'
												bg='transparent'
												px='0'
												color='fg.muted'
												cursor='pointer'
												_hover={{ color: 'fg.default' }}
												onClick={() => openFolder(segment.id)}
											>
												{segment.name}
											</ChakraButton>
										)}
										{idx < breadcrumb.length - 2 && <ChevronRight size={10} strokeWidth={2} />}
									</Flex>
								))}
							</Flex>
						)}
						{editingName ? (
							<Input
								ref={el => {
									nameInputRef.current = el;
									if (el && document.activeElement !== el) {
										el.focus();
										el.select();
									}
								}}
								value={nameDraft}
								onChange={event => setNameDraft(event.target.value)}
								onKeyDown={event => {
									if (event.key === 'Enter') {
										event.preventDefault();
										commitNameEdit();
									} else if (event.key === 'Escape') {
										event.preventDefault();
										cancelNameEdit();
									}
								}}
								onBlur={commitNameEdit}
								size='lg'
								h='38px'
								px='2'
								fontSize='3xl'
								fontWeight='700'
								letterSpacing='-0.02em'
								borderRadius='md'
								borderWidth='1px'
								borderColor='accent.pink'
								bg='bg.surface'
							/>
						) : (
							<Flex
								align='center'
								gap='2'
								className='folder-overview-title'
								css={{
									'& .folder-overview-rename-trigger': { opacity: 0, transition: 'opacity .12s ease' },
									'&:hover .folder-overview-rename-trigger': { opacity: 1 },
								}}
							>
								<Box fontSize='3xl' fontWeight='700' letterSpacing='-0.02em' lineHeight='1.05' color='fg.default'>
									{node.name}
								</Box>
								<ChakraButton
									type='button'
									className='folder-overview-rename-trigger'
									bg='transparent'
									color='fg.subtle'
									p='1'
									borderRadius='sm'
									cursor='pointer'
									_hover={{ color: 'fg.default', bg: 'color-mix(in srgb, var(--beak-colors-fg-default) 6%, transparent)' }}
									onClick={startNameEdit}
									title='Rename folder'
									aria-label='Rename folder'
								>
									<Pencil size={14} strokeWidth={2} />
								</ChakraButton>
							</Flex>
						)}
					</Box>
				</Flex>

				{collection && (
					<Flex align='center' gap='2' mt='2' mb='1' wrap='wrap'>
						<SourceBadge source={collection.source} />
						{collection.defaults?.verb && (
							<Box
								as='span'
								fontSize='10px'
								fontWeight='700'
								letterSpacing='0.06em'
								color={verbToColor(collection.defaults.verb)}
								px='2'
								py='0.5'
								borderRadius='sm'
								borderWidth='1px'
								borderColor='color-mix(in srgb, currentColor 28%, transparent)'
								bg='color-mix(in srgb, currentColor 8%, transparent)'
							>
								{`DEFAULT ${verbToShortLabel(collection.defaults.verb)}`}
							</Box>
						)}
						{(() => {
							const baseUrlParts = collection.defaults?.baseUrl as ReadonlyArray<unknown> | undefined;
							if (!baseUrlParts || baseUrlParts.length === 0) return null;
							const rendered = renderValueParts(baseUrlParts);
							return (
								<Box
									fontFamily='mono'
									fontSize='11px'
									color='fg.muted'
									px='2'
									py='0.5'
									borderRadius='sm'
									borderWidth='1px'
									borderColor='border.subtle'
									bg='bg.surface'
									truncate
									maxW='420px'
									title={rendered}
								>
									{rendered}
								</Box>
							);
						})()}
					</Flex>
				)}

				<Box fontSize='sm' color='fg.subtle' mt='1' mb='6'>
					{summaryText(folders.length, requests.length, childWorkflows.length)}
				</Box>

				<Flex gap='2' mb='8' wrap='wrap'>
					<QuickAction icon={<Plus size={13} strokeWidth={2.2} />} label='New request' onClick={newRequest} accent='pink' />
					<QuickAction
						icon={<FolderPlus size={13} strokeWidth={2.2} />}
						label='New folder'
						onClick={newFolder}
						accent='indigo'
					/>
					<QuickAction
						icon={<WorkflowIcon size={13} strokeWidth={2.2} />}
						label='New workflow'
						onClick={newWorkflow}
						accent='teal'
					/>
				</Flex>

				{totalChildren === 0 && (
					<Box
						borderWidth='1px'
						borderColor='border.subtle'
						borderRadius='md'
						bg='bg.surface'
						px='5'
						py='6'
						textAlign='center'
					>
						<Box fontSize='sm' fontWeight='600' color='fg.default' mb='1'>
							{'This folder is empty'}
						</Box>
						<Box fontSize='12px' color='fg.muted'>
							{'Use the actions above to create a request, folder, or workflow inside it.'}
						</Box>
					</Box>
				)}

				{folders.length > 0 && (
					<Section title='Folders' count={folders.length}>
						<ChildGrid>
							{folders.map(f => (
								<ChildCard key={f.id} onClick={() => openFolder(f.id)}>
									<Flex align='center' gap='2'>
										<Box color='accent.indigo' display='inline-flex'>
											<Folder size={14} strokeWidth={2} />
										</Box>
										<Box fontSize='sm' fontWeight='600' color='fg.default' truncate>
											{f.name}
										</Box>
									</Flex>
								</ChildCard>
							))}
						</ChildGrid>
					</Section>
				)}

				{requests.length > 0 && (
					<Section title='Requests' count={requests.length}>
						<ChildGrid>
							{requests.map(r => {
								const verb = r.mode === 'valid' ? r.info.verb : 'get';
								return (
									<ChildCard key={r.id} onClick={() => openRequest(r.id)}>
										<Flex align='center' gap='2' minW={0}>
											<Box
												as='span'
												display='inline-flex'
												alignItems='center'
												justifyContent='center'
												flexShrink={0}
												w='32px'
												fontSize='9px'
												fontWeight='700'
												letterSpacing='0.04em'
												color={verbToColor(verb)}
											>
												{verbToShortLabel(verb)}
											</Box>
											<Box fontSize='sm' fontWeight='600' color='fg.default' truncate flex='1' minW={0}>
												{r.name}
											</Box>
											<Box color='fg.subtle' display='inline-flex' flexShrink={0}>
												<ArrowUpRight size={12} strokeWidth={2} />
											</Box>
										</Flex>
									</ChildCard>
								);
							})}
						</ChildGrid>
					</Section>
				)}

				{childWorkflows.length > 0 && (
					<Section title='Workflows' count={childWorkflows.length}>
						<ChildGrid>
							{childWorkflows.map(w => (
								<ChildCard key={w.id} onClick={() => openWorkflow(w.id)}>
									<Flex align='center' gap='2'>
										<Box color='accent.teal' display='inline-flex'>
											<WorkflowIcon size={14} strokeWidth={2} />
										</Box>
										<Box fontSize='sm' fontWeight='600' color='fg.default' truncate>
											{w.name}
										</Box>
									</Flex>
								</ChildCard>
							))}
						</ChildGrid>
					</Section>
				)}
			</Box>
		</Box>
	);
};

interface QuickActionProps {
	icon: React.ReactNode;
	label: string;
	onClick: () => void;
	accent: 'pink' | 'indigo' | 'teal';
}

const QuickAction: React.FC<QuickActionProps> = ({ icon, label, onClick, accent }) => (
	<ChakraButton
		type='button'
		display='inline-flex'
		alignItems='center'
		gap='2'
		px='3'
		py='2'
		borderRadius='md'
		borderWidth='1px'
		borderColor='border.subtle'
		bg='bg.surface'
		fontSize='12px'
		fontWeight='600'
		color='fg.default'
		cursor='pointer'
		transition='border-color .12s ease, background-color .12s ease, color .12s ease'
		_hover={{
			borderColor: `accent.${accent}`,
			color: `accent.${accent}`,
			bg: `color-mix(in srgb, var(--beak-colors-accent-${accent}) 6%, var(--beak-colors-bg-surface))`,
		}}
		onClick={onClick}
	>
		<Box as='span' color={`accent.${accent}`} display='inline-flex'>
			{icon}
		</Box>
		{label}
	</ChakraButton>
);

interface SectionProps {
	title: string;
	count: number;
	children: React.ReactNode;
}

const Section: React.FC<SectionProps> = ({ title, count, children }) => (
	<Box mb='6'>
		<Flex align='baseline' gap='2' mb='2'>
			<Box fontSize='10px' fontWeight='700' letterSpacing='0.08em' textTransform='uppercase' color='fg.subtle'>
				{title}
			</Box>
			<Box fontSize='10px' color='fg.disabled' fontWeight='600'>
				{count}
			</Box>
		</Flex>
		{children}
	</Box>
);

const ChildGrid: React.FC<{ children: React.ReactNode }> = ({ children }) => (
	<Box display='grid' gap='2' gridTemplateColumns='repeat(auto-fill, minmax(220px, 1fr))'>
		{children}
	</Box>
);

const ChildCard: React.FC<{ children: React.ReactNode; onClick: () => void }> = ({ children, onClick }) => (
	<ChakraButton
		type='button'
		display='block'
		w='100%'
		textAlign='left'
		px='3'
		py='2.5'
		borderWidth='1px'
		borderColor='border.subtle'
		borderRadius='md'
		bg='bg.surface'
		cursor='pointer'
		transition='border-color .12s ease, background-color .12s ease'
		_hover={{
			borderColor: 'accent.pink',
			bg: 'color-mix(in srgb, var(--beak-colors-accent-pink) 4%, var(--beak-colors-bg-surface))',
		}}
		onClick={onClick}
	>
		{children}
	</ChakraButton>
);

const SOURCE_LABEL: Record<CollectionSource['type'], string> = {
	manual: 'Manual',
	openapi: 'OpenAPI',
	graphql: 'GraphQL',
	grpc: 'gRPC',
};

const SOURCE_ACCENT: Record<CollectionSource['type'], 'indigo' | 'pink' | 'teal' | 'warning'> = {
	manual: 'indigo',
	openapi: 'pink',
	graphql: 'teal',
	grpc: 'warning',
};

const SourceBadge: React.FC<{ source: CollectionSource }> = ({ source }) => {
	const accent = SOURCE_ACCENT[source.type];
	const label = SOURCE_LABEL[source.type];
	const detail =
		source.type === 'graphql' || source.type === 'grpc'
			? source.endpoint
			: source.type === 'openapi'
				? (source.specUrl ?? source.specPath)
				: undefined;

	return (
		<Flex
			as='span'
			align='center'
			gap='1.5'
			fontSize='10px'
			fontWeight='700'
			letterSpacing='0.06em'
			textTransform='uppercase'
			color={`accent.${accent}`}
			px='2'
			py='0.5'
			borderRadius='sm'
			borderWidth='1px'
			borderColor={`color-mix(in srgb, var(--beak-colors-accent-${accent}) 28%, transparent)`}
			bg={`color-mix(in srgb, var(--beak-colors-accent-${accent}) 10%, transparent)`}
			maxW='320px'
			minW={0}
		>
			<Box as='span'>{label}</Box>
			{detail && (
				<Box as='span' fontWeight='600' opacity={0.85} truncate minW={0} title={detail}>
					{detail}
				</Box>
			)}
		</Flex>
	);
};

function renderValueParts(parts: ReadonlyArray<unknown>): string {
	return parts
		.map(p => {
			if (typeof p === 'string') return p;
			if (p && typeof p === 'object' && 'type' in p && typeof (p as { type: unknown }).type === 'string') {
				return `{{${(p as { type: string }).type}}}`;
			}
			return '';
		})
		.join('');
}

function summaryText(folders: number, requests: number, workflows: number): string {
	const parts: string[] = [];
	if (folders > 0) parts.push(`${folders} folder${folders === 1 ? '' : 's'}`);
	if (requests > 0) parts.push(`${requests} request${requests === 1 ? '' : 's'}`);
	if (workflows > 0) parts.push(`${workflows} workflow${workflows === 1 ? '' : 's'}`);
	if (parts.length === 0) return 'No items inside yet.';
	return parts.join(' • ');
}

function buildBreadcrumb(folderId: string, tree: Record<string, Nodes>): Array<{ id: string; name: string }> {
	const self = tree[folderId];
	const ancestors = projectTree.getParentChain(tree, folderId);
	// `getParentChain` walks parent-first; the breadcrumb wants root-first.
	const chain: Array<{ id: string; name: string }> = [];
	for (let i = ancestors.length - 1; i >= 0; i--) {
		const a = ancestors[i]!;
		chain.push({ id: a.id, name: a.name });
	}
	if (self) chain.push({ id: self.id, name: self.name });
	chain.unshift({ id: 'root', name: 'Project' });
	return chain;
}

function groupChildren(
	folderId: string,
	tree: Record<string, Nodes>,
): { folders: FolderNode[]; requests: RequestNode[] } {
	const folders = projectTree
		.findChildren(tree, folderId, 'folder')
		.slice()
		.sort((a, b) => a.name.localeCompare(b.name));
	const requests = projectTree
		.findChildren(tree, folderId, 'request')
		.slice()
		.sort((a, b) => a.name.localeCompare(b.name));
	return { folders, requests };
}

export default FolderOverview;
