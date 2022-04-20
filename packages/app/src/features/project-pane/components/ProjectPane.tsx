import React, { useContext } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import WindowSessionContext from '@beak/app/contexts/window-session-context';
import { ipcExplorerService } from '@beak/app/lib/ipc';
import { actions } from '@beak/app/store/project';
import { NodeType } from '@beak/common/types/beak-project';
import ksuid from '@cuvva/ksuid';
import type { MenuItemConstructorOptions } from 'electron';

import SidebarPane from '../../sidebar/components/SidebarPane';
import SidebarPaneSection from '../../sidebar/components/SidebarPaneSection';
import { changeTab, makeTabPermanent } from '../../tabs/store/actions';
import TreeView from '../../tree-view/components/TreeView';
import { TreeViewItem } from '../../tree-view/types';
import Git from './organisms/Git';
import VariableGroups from './organisms/VariableGroups';

const ProjectPane: React.FunctionComponent = () => {
	const { id, tree, name } = useSelector(s => s.global.project);
	const selectedTabId = useSelector(s => s.features.tabs.selectedTab);
	const windowSession = useContext(WindowSessionContext);
	const darwin = windowSession.isDarwin();
	const dispatch = useDispatch();

	function generateContextMenu(node: TreeViewItem): MenuItemConstructorOptions[] {
		return [{
			id: ksuid.generate('ctxmenuitem').toString(),
			accelerator: 'CmdOrCtrl+Shift+N',
			label: 'New request',
			click: () => {
				dispatch(actions.createNewRequest({ highlightedNodeId: node.id }));
			},
		}, {
			id: ksuid.generate('ctxmenuitem').toString(),
			label: 'Duplicate request',
			accelerator: 'CmdOrCtrl+D',
			enabled: node.type === 'request',
			click: () => {
				dispatch(actions.duplicateRequest({ requestId: node.id }));
			},
		}, {
			id: ksuid.generate('ctxmenuitem').toString(),
			label: 'New folder',
			accelerator: 'CmdOrCtrl+Alt+N',
			click: () => {
				dispatch(actions.createNewFolder({ highlightedNodeId: node?.id }));
			},
		}, {
			id: ksuid.generate('ctxmenuitem').toString(),
			label: `Reveal in ${darwin ? 'Finder' : 'Explorer'}`,
			enabled: node.id !== 'root',
			click: () => {
				ipcExplorerService.revealFile(node.filePath);
			},
		},

		{ id: ksuid.generate('ctxmenuitem').toString(), type: 'separator' },

		{
			id: ksuid.generate('ctxmenuitem').toString(),
			label: 'Copy request share link',
			enabled: node.type === 'request',
			click: async () => {
				const search = new URLSearchParams({ requestId: node.id });
				const url = `https://share.getbeak.app/projects/${encodeURIComponent(id!)}?${search.toString()}`;

				await navigator.clipboard.writeText(url);
			},
		},

		{ id: ksuid.generate('ctxmenuitem').toString(), type: 'separator' },

		{ id: ksuid.generate('ctxmenuitem').toString(), label: 'Copy', enabled: false },
		{ id: ksuid.generate('ctxmenuitem').toString(), label: 'Cut', enabled: false },
		{ id: ksuid.generate('ctxmenuitem').toString(), label: 'Paste', enabled: false },	

		{ id: ksuid.generate('ctxmenuitem').toString(), type: 'separator' },

		{
			id: ksuid.generate('ctxmenuitem').toString(),
			label: 'Copy path',
			enabled: node.id !== 'root',
			click: () => ipcExplorerService.copyFullNodePath(node.filePath),
		},
		{
			id: ksuid.generate('ctxmenuitem').toString(),
			label: 'Copy relative path',
			enabled: node.id !== 'root',
			click: () => navigator.clipboard.writeText(node.filePath),
		},

		{ id: ksuid.generate('ctxmenuitem').toString(), type: 'separator' },

		{
			id: ksuid.generate('ctxmenuitem').toString(),
			label: 'Rename',
			accelerator: darwin ? 'Return' : 'F2',
			enabled: node.id !== 'root',
			click: () => {
				if (node.id === 'root')
					return;

				dispatch(actions.renameStarted({ requestId: node.id, type: node.type as NodeType }));
			},
		}, {
			id: ksuid.generate('ctxmenuitem').toString(),
			label: 'Delete',
			accelerator: 'CmdOrCtrl+Backspace',
			enabled: node.id !== 'root',
			click: () => {
				dispatch(actions.removeNodeFromDisk({ requestId: node.id, withConfirmation: true }));
			},
		}];
	}

	return (
		<SidebarPane>
			<SidebarPaneSection title={`Project :: ${name!}`} collapseKey={'beak.project.project'}>
				<Git />
			</SidebarPaneSection>
			<SidebarPaneSection title={'Variable groups'} collapseKey={'beak.project.variable-groups'}>
				<VariableGroups />
			</SidebarPaneSection>
			<SidebarPaneSection title={'Explorer'} collapseKey={'beak.project.explorer'}>
				<TreeView
					activeNodeId={selectedTabId}
					tree={tree}
					onContextMenu={node => generateContextMenu(node)}
					onDrop={(sourceNodeId, destinationNodeId) => actions.moveNodeOnDisk({
						sourceNodeId,
						destinationNodeId,
					})}
					onNodeClick={(_event, node) => {
						if (node.type === 'folder')
							return;

						dispatch(changeTab({
							type: 'request',
							payload: node.id,
							temporary: true,
						}));
					}}
					onNodeDoubleClick={(_event, node) => {
						if (node.type === 'folder')
							return;

						dispatch(makeTabPermanent(node.id));
					}}
				/>
			</SidebarPaneSection>
		</SidebarPane>
	);
};

export default ProjectPane;
