import WindowSessionContext from '@beak/ui/contexts/window-session-context';
import { ipcExplorerService } from '@beak/ui/lib/ipc';
import { checkShortcut } from '@beak/ui/lib/keyboard-shortcuts';
import { actions } from '@beak/ui/store/project';
import { useAppSelector } from '@beak/ui/store/redux';
import { renderAcceleratorDefinition } from '@beak/ui/utils/keyboard-rendering';
import type { MenuItemConstructorOptions } from 'electron';
import React, { useContext } from 'react';
import { useDispatch } from 'react-redux';

import SidebarPane from '../../sidebar/components/SidebarPane';
import SidebarPaneSection from '../../sidebar/components/SidebarPaneSection';
import { changeTab, makeTabPermanent } from '../../tabs/store/actions';
import TreeView from '../../tree-view/components/TreeView';
import type { TreeViewItem } from '../../tree-view/types';
import RequestFlightStatus from './molecules/RequestFlightStatus';
import Git from './organisms/Git';
import VariableSets from './organisms/VariableSets';

const ProjectPane: React.FC<React.PropsWithChildren<unknown>> = () => {
	const { id, tree, name } = useAppSelector(s => s.global.project);
	const selectedTabId = useAppSelector(s => s.features.tabs.selectedTab);
	const windowSession = useContext(WindowSessionContext);
	const darwin = windowSession.isDarwin();
	const dispatch = useDispatch();

	function generateContextMenu(node: TreeViewItem): MenuItemConstructorOptions[] {
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
				enabled: node.type === 'request',
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
				id: 'project-tree-ctx:reveal',
				label: `Reveal in ${darwin ? 'Finder' : 'Explorer'}`,
				enabled: node.id !== 'root',
				click: () => {
					ipcExplorerService.revealFile(node.filePath);
				},
			},

			{ id: 'project-tree-ctx:sep-1', type: 'separator' },

			{
				id: 'project-tree-ctx:share-link',
				label: 'Copy Request Share Link',
				enabled: node.type === 'request',
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
				enabled: node.id !== 'root',
				click: () => ipcExplorerService.copyFullNodePath(node.filePath),
			},
			{
				id: 'project-tree-ctx:copy-relative-path',
				label: 'Copy Relative Path',
				enabled: node.id !== 'root',
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

					dispatch(actions.renameStarted({ requestId: node.id }));
				},
			},
			{
				id: 'project-tree-ctx:delete',
				label: 'Delete',
				accelerator: renderAcceleratorDefinition('tree-view.node.delete'),
				enabled: node.id !== 'root',
				click: () => {
					dispatch(actions.removeNodeFromDisk({ requestId: node.id, withConfirmation: true }));
				},
			},
		];
	}

	function handleNodeClick(_event: React.MouseEvent<HTMLDivElement>, node: TreeViewItem) {
		if (node.type === 'folder') return;

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
			case checkShortcut('project-explorer.request.open', event) && node.type !== 'folder':
				dispatch(changeTab({ type: 'request', payload: node.id, temporary: false }));
				break;

			case checkShortcut('project-explorer.request.duplicate', event) && node.type !== 'folder':
				dispatch(actions.duplicateRequest({ requestId: node.id }));
				break;

			case checkShortcut('project-explorer.item.delete', event):
				dispatch(actions.removeNodeFromDisk({ requestId: node.id, withConfirmation: true }));
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
			<SidebarPaneSection title={name ?? 'Project'} collapseKey={'beak.project.explorer'}>
				<TreeView
					tree={tree}
					rootParentName={'tree'}
					activeNodeId={selectedTabId}
					allowRootContextMenu
					nodeFlairRenderers={{ request: node => <RequestFlightStatus node={node} /> }}
					onDrop={(sourceNodeId, destinationNodeId) =>
						actions.moveNodeOnDisk({
							sourceNodeId,
							destinationNodeId,
						})
					}
					renameSelector={(_node, state) => state.global.project.activeRename}
					onRenameStarted={node => dispatch(actions.renameStarted({ requestId: node.id }))}
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
