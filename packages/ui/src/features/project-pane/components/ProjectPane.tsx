import { renameProject } from '@beak/state/project';
import WindowSessionContext from '@beak/ui/contexts/window-session-context';
import { ipcExplorerService } from '@beak/ui/lib/ipc';
import { checkShortcut } from '@beak/ui/lib/keyboard-shortcuts';
import { projectPanePreferenceSetExplorerFilter } from '@beak/ui/store/preferences/actions';
import { actions } from '@beak/ui/store/project';
import { useAppSelector } from '@beak/ui/store/redux';
import { actions as workflowActions } from '@beak/ui/store/workflows';
import { renderAcceleratorDefinition } from '@beak/ui/utils/keyboard-rendering';
import { Box, Input } from '@chakra-ui/react';
import type { MenuItemConstructorOptions } from 'electron';
import {
	ChevronsDownUp,
	ChevronsUpDown,
	FilePlus,
	FolderPlus,
	Pencil,
	Workflow as WorkflowIcon,
} from 'lucide-react';
import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';

import SidebarPane from '../../sidebar/components/SidebarPane';
import SidebarPaneSection, { type InlineSectionAction } from '../../sidebar/components/SidebarPaneSection';
import { changeTab, makeTabPermanent } from '../../tabs/store/actions';
import TreeView from '../../tree-view/components/TreeView';
import type { TreeCommands } from '../../tree-view/contexts/abstractions-context';
import type { TreeViewItem, TreeViewNodes } from '../../tree-view/types';
import ExplorerFilterMenu, { type ExplorerFilter } from './molecules/ExplorerFilterMenu';
import RequestFlair from './molecules/RequestFlair';
import CookieJars from './organisms/CookieJars';
import Git from './organisms/Git';
import VariableSets from './organisms/VariableSets';
import Workflows from './organisms/Workflows';

/**
 * Filter the merged project tree by leaf type (request vs workflow), pruning
 * folders that have no matching descendants. `all` is a fast pass-through —
 * the common case. Folders without matches disappear so the filter actually
 * shortens the visible list rather than just re-flavouring it.
 */
function filterMergedTree(tree: TreeViewNodes, filter: ExplorerFilter): TreeViewNodes {
	if (filter === 'all') return tree;

	const keepLeafType = filter === 'requests' ? 'request' : 'workflow';
	const kept = new Set<string>();

	for (const [id, node] of Object.entries(tree)) {
		if (node.type === keepLeafType) kept.add(id);
	}

	for (const id of Array.from(kept)) {
		let cursor: string | null = tree[id]?.parent ?? null;
		while (cursor && cursor !== 'root' && tree[cursor]?.type === 'folder' && !kept.has(cursor)) {
			kept.add(cursor);
			cursor = tree[cursor]?.parent ?? null;
		}
	}

	const next: TreeViewNodes = {};
	for (const id of kept) {
		const node = tree[id];
		if (node) next[id] = node;
	}
	return next;
}

const ProjectPane: React.FC<React.PropsWithChildren<unknown>> = () => {
	const { id, tree, name, mode } = useAppSelector(s => s.global.project);
	const workflows = useAppSelector(s => s.global.workflows.workflows);
	const selectedTabId = useAppSelector(s => s.features.tabs.selectedTab);
	const showHiddenFolders = useAppSelector(s => Boolean(s.global.preferences.projectPane?.showHiddenFolders));
	const explorerFilter = useAppSelector<ExplorerFilter>(
		s => s.global.preferences.projectPane?.explorerFilter ?? 'all',
	);
	const windowSession = useContext(WindowSessionContext);
	const darwin = windowSession.isDarwin();
	const dispatch = useDispatch();
	const [renaming, setRenaming] = useState(false);
	const [draft, setDraft] = useState(name ?? 'Project');
	const renameInputRef = useRef<HTMLInputElement | null>(null);
	const treeCommandsRef = useRef<TreeCommands | null>(null);

	useEffect(() => {
		if (!renaming) setDraft(name ?? 'Project');
	}, [name, renaming]);

	function startRename() {
		// Memory-mode rename works in redux but isn't persisted until Save
		// Project As. The user can still see the new name immediately; the
		// banner already nudges them to save.
		setDraft(name ?? 'Project');
		setRenaming(true);
	}

	function commitRename() {
		const next = draft.trim();
		setRenaming(false);
		if (!next || next === name) return;
		dispatch(renameProject({ name: next }));
	}

	function cancelRename() {
		setDraft(name ?? 'Project');
		setRenaming(false);
	}

	const projectSectionActions = useMemo<InlineSectionAction[]>(
		() => [
			{
				id: 'project-pane:rename',
				label: mode === 'memory' ? 'Rename project (saves on Save Project As)' : 'Rename project',
				icon: Pencil,
				onClick: startRename,
			},
			{
				id: 'project-pane:new-workflow',
				label: 'New workflow',
				icon: WorkflowIcon,
				onClick: () => dispatch(workflowActions.createNewWorkflow({ parent: null })),
			},
			{
				id: 'project-pane:new-request',
				label: 'New request',
				icon: FilePlus,
				onClick: () => dispatch(actions.createNewRequest({ highlightedNodeId: undefined })),
			},
			{
				id: 'project-pane:new-folder',
				label: 'New folder',
				icon: FolderPlus,
				onClick: () => dispatch(actions.createNewFolder({ highlightedNodeId: undefined })),
			},
			{
				id: 'project-pane:collapse-all',
				label: 'Collapse all',
				icon: ChevronsDownUp,
				onClick: () => treeCommandsRef.current?.collapseAll(),
			},
			{
				id: 'project-pane:expand-all',
				label: 'Expand all',
				icon: ChevronsUpDown,
				onClick: () => treeCommandsRef.current?.expandAll(),
			},
		],
		[dispatch, mode],
	);

	// Merge workflows into the tree as peer nodes. Each workflow becomes a
	// synthetic TreeViewNode with `type: 'workflow'` and a parent pulled from
	// its file (null = project root, mapped to 'root' for the TreeView). The
	// underlying workflow store stays the source of truth — clicks/deletes
	// dispatch to it, not to the project tree actions.
	const mergedTree = useMemo<TreeViewNodes>(() => {
		const next: TreeViewNodes = { ...tree };
		for (const wf of Object.values(workflows)) {
			const parent = wf.parent ?? 'root';
			// Only attach the workflow if its parent exists in the tree (or is root).
			// Orphans (parent folder deleted) fall back to root so they're never
			// invisible.
			const parentOk = parent === 'root' || tree[parent]?.type === 'folder';
			next[wf.id] = {
				id: wf.id,
				type: 'workflow',
				name: wf.name,
				filePath: '',
				parent: parentOk ? parent : 'root',
			};
		}
		return next;
	}, [tree, workflows]);

	const displayedTree = useMemo(
		() => filterMergedTree(mergedTree, explorerFilter),
		[mergedTree, explorerFilter],
	);

	function generateContextMenu(node: TreeViewItem, commands?: TreeCommands): MenuItemConstructorOptions[] {
		const isWorkflow = node.type === 'workflow';
		const isFolder = node.type === 'folder';
		const isRequest = node.type === 'request';
		const isRoot = node.id === 'root';
		const folderScopeForExpand = isFolder || isRoot;
		// New workflow drops inside the highlighted folder, or under whatever folder
		// owns the highlighted item. Root gives null (no parent).
		const newWorkflowParent = (() => {
			if (node.id === 'root') return null;
			if (isFolder) return node.id;
			return tree[node.id]?.parent && tree[node.id].parent !== 'root' ? tree[node.id].parent : null;
		})();

		return [
			{
				id: 'project-tree-ctx:new-request',
				accelerator: renderAcceleratorDefinition('menu-bar.file.new-request'),
				label: 'New Request',
				click: () => {
					dispatch(actions.createNewRequest({ highlightedNodeId: node.id }));
				},
			},
			{
				id: 'project-tree-ctx:duplicate-request',
				label: 'Duplicate Request',
				accelerator: renderAcceleratorDefinition('project-explorer.request.duplicate'),
				enabled: isRequest,
				click: () => {
					dispatch(actions.duplicateRequest({ requestId: node.id }));
				},
			},
			{
				id: 'project-tree-ctx:new-folder',
				label: 'New Folder',
				accelerator: renderAcceleratorDefinition('menu-bar.file.new-folder'),
				click: () => {
					dispatch(actions.createNewFolder({ highlightedNodeId: node?.id }));
				},
			},
			{
				id: 'project-tree-ctx:new-workflow',
				label: 'New Workflow',
				click: () => {
					dispatch(workflowActions.createNewWorkflow({ parent: newWorkflowParent }));
				},
			},
			{
				id: 'project-tree-ctx:reveal',
				label: `Reveal in ${darwin ? 'Finder' : 'Explorer'}`,
				enabled: node.id !== 'root' && !isWorkflow,
				click: () => {
					ipcExplorerService.revealFile(node.filePath);
				},
			},

			{ id: 'project-tree-ctx:sep-1', type: 'separator' },

			{
				id: 'project-tree-ctx:share-link',
				label: 'Copy Request Share Link',
				enabled: isRequest,
				click: async () => {
					if (!id) return;
					const search = new URLSearchParams({ requestId: node.id });
					const url = `https://share.getbeak.app/projects/${encodeURIComponent(id)}?${search.toString()}`;

					await navigator.clipboard.writeText(url).catch(err => {
						console.warn('clipboard write failed', err);
					});
				},
			},

			{ id: 'project-tree-ctx:sep-2', type: 'separator' },

			{ id: 'project-tree-ctx:copy', label: 'Copy', enabled: false },
			{ id: 'project-tree-ctx:cut', label: 'Cut', enabled: false },
			{ id: 'project-tree-ctx:paste', label: 'Paste', enabled: false },

			{ id: 'project-tree-ctx:sep-3', type: 'separator' },

			{
				id: 'project-tree-ctx:copy-path',
				label: 'Copy Path',
				enabled: node.id !== 'root' && !isWorkflow,
				click: () => ipcExplorerService.copyFullNodePath(node.filePath),
			},
			{
				id: 'project-tree-ctx:copy-relative-path',
				label: 'Copy Relative Path',
				enabled: node.id !== 'root' && !isWorkflow,
				click: () => navigator.clipboard.writeText(node.filePath),
			},

			{ id: 'project-tree-ctx:sep-4', type: 'separator' },

			{
				id: 'project-tree-ctx:rename',
				label: 'Rename',
				accelerator: renderAcceleratorDefinition('tree-view.node.rename'),
				enabled: node.id !== 'root',
				click: () => {
					if (node.id === 'root') return;
					// Workflows aren't in the project tree, so seed the rename's
					// inline-edit buffer with the node name explicitly — the
					// reducer's tree-lookup fallback would miss otherwise.
					dispatch(actions.renameStarted({ requestId: node.id, name: node.name }));
				},
			},
			{
				id: 'project-tree-ctx:delete',
				label: 'Delete',
				accelerator: renderAcceleratorDefinition('tree-view.node.delete'),
				enabled: node.id !== 'root',
				click: () => {
					if (isWorkflow) {
						dispatch(workflowActions.removeWorkflowFromDisk({ id: node.id, withConfirmation: true }));
					} else {
						dispatch(actions.removeNodeFromDisk({ requestId: node.id, withConfirmation: true }));
					}
				},
			},

			{ id: 'project-tree-ctx:sep-5', type: 'separator' },

			{
				id: 'project-tree-ctx:expand-all',
				label: isRoot ? 'Expand all' : 'Expand all under this folder',
				enabled: folderScopeForExpand && Boolean(commands),
				click: () => {
					if (isRoot) commands?.expandAll();
					else commands?.expandDescendantsOf(node.id);
				},
			},
			{
				id: 'project-tree-ctx:collapse-all',
				label: isRoot ? 'Collapse all' : 'Collapse all under this folder',
				enabled: folderScopeForExpand && Boolean(commands),
				click: () => {
					if (isRoot) commands?.collapseAll();
					else commands?.collapseDescendantsOf(node.id);
				},
			},
		];
	}

	function handleNodeClick(_event: React.MouseEvent<HTMLDivElement>, node: TreeViewItem) {
		if (node.type === 'folder') {
			dispatch(changeTab({ type: 'folder_overview', payload: node.id, temporary: true }));
			return;
		}

		if (node.type === 'workflow') {
			dispatch(changeTab({ type: 'workflow_editor', payload: node.id, temporary: true }));
			return;
		}

		dispatch(
			changeTab({
				type: 'request',
				payload: node.id,
				temporary: true,
			}),
		);
	}

	function handleNodeDoubleClick(_event: React.MouseEvent<HTMLDivElement>, node: TreeViewItem) {
		if (node.type === 'folder') return;

		dispatch(makeTabPermanent(node.id));
	}

	function handleNodeKeyDown(event: React.KeyboardEvent<HTMLDivElement>, node: TreeViewItem) {
		switch (true) {
			case checkShortcut('project-explorer.request.open', event):
				if (node.type === 'folder') {
					dispatch(changeTab({ type: 'folder_overview', payload: node.id, temporary: false }));
				} else if (node.type === 'workflow') {
					dispatch(changeTab({ type: 'workflow_editor', payload: node.id, temporary: false }));
				} else {
					dispatch(changeTab({ type: 'request', payload: node.id, temporary: false }));
				}
				break;

			case checkShortcut('project-explorer.request.duplicate', event) && node.type === 'request':
				dispatch(actions.duplicateRequest({ requestId: node.id }));
				break;

			case checkShortcut('project-explorer.item.delete', event):
				if (node.type === 'workflow') {
					dispatch(workflowActions.removeWorkflowFromDisk({ id: node.id, withConfirmation: true }));
				} else {
					dispatch(actions.removeNodeFromDisk({ requestId: node.id, withConfirmation: true }));
				}
				break;

			default:
				return;
		}

		event.preventDefault();
	}

	return (
		<SidebarPane>
			<SidebarPaneSection title={'Source control'} collapseKey={'beak.project.project'}>
				<Git />
			</SidebarPaneSection>
			<SidebarPaneSection title={'Variable sets'} collapseKey={'beak.project.variable-sets'}>
				<VariableSets />
			</SidebarPaneSection>
			<SidebarPaneSection title={'Cookies'} collapseKey={'beak.project.cookies'}>
				<CookieJars />
			</SidebarPaneSection>
			<SidebarPaneSection title={'Workflows'} collapseKey={'beak.project.workflows'}>
				<Workflows />
			</SidebarPaneSection>
			<SidebarPaneSection
				title={
					renaming ? (
						<Input
							ref={el => {
								renameInputRef.current = el;
								if (el && document.activeElement !== el) {
									el.focus();
									el.select();
								}
							}}
							value={draft}
							size='xs'
							h='18px'
							px='1'
							fontSize='11px'
							fontWeight='600'
							letterSpacing='0.04em'
							textTransform='uppercase'
							borderRadius='sm'
							borderWidth='1px'
							borderColor='accent.pink'
							bg='bg.surface'
							onClick={event => event.stopPropagation()}
							onKeyDown={event => {
								event.stopPropagation();
								if (event.key === 'Enter') {
									event.preventDefault();
									commitRename();
								} else if (event.key === 'Escape') {
									event.preventDefault();
									cancelRename();
								}
							}}
							onChange={event => setDraft(event.target.value)}
							onBlur={commitRename}
						/>
					) : (
						<Box as='span'>{name ?? 'Project'}</Box>
					)
				}
				inlineActions={projectSectionActions}
				headerSlot={
					<ExplorerFilterMenu
						value={explorerFilter}
						onChange={next => dispatch(projectPanePreferenceSetExplorerFilter(next))}
					/>
				}
				collapseKey={'beak.project.explorer'}
			>
				<TreeView
					tree={displayedTree}
					rootParentName={'tree'}
					activeNodeId={selectedTabId}
					allowRootContextMenu
					showHidden={showHiddenFolders}
					commandsRef={treeCommandsRef}
					nodeFlairRenderers={{
						request: node => <RequestFlair node={node} />,
					}}
					onDrop={(sourceNodeId, destinationNodeId) => {
						// Workflows live in their own slice and persist `parent` as a
						// folder id (= the folder's filePath, since folders are id'd by
						// path). Drop-on-root → null, drop-on-folder → the folder id.
						if (workflows[sourceNodeId]) {
							return workflowActions.setWorkflowParent({
								id: sourceNodeId,
								parent: destinationNodeId === 'root' ? null : destinationNodeId,
							});
						}
						return actions.moveNodeOnDisk({ sourceNodeId, destinationNodeId });
					}}
					renameSelector={(_node, state) => state.global.project.activeRename}
					onRenameStarted={node => dispatch(actions.renameStarted({ requestId: node.id, name: node.name }))}
					onRenameEnded={node => dispatch(actions.renameCancelled({ requestId: node.id }))}
					onRenameUpdated={(node, name) => dispatch(actions.renameUpdated({ requestId: node.id, name }))}
					onRenameSubmitted={node => dispatch(actions.renameSubmitted({ requestId: node.id }))}
					onContextMenu={generateContextMenu}
					onNodeClick={handleNodeClick}
					onNodeDoubleClick={handleNodeDoubleClick}
					onNodeKeyDown={handleNodeKeyDown}
				/>
			</SidebarPaneSection>
		</SidebarPane>
	);
};

export default ProjectPane;
