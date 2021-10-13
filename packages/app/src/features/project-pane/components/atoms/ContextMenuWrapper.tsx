import ContextMenu from '@beak/app/components/atoms/ContextMenu';
import WindowSessionContext from '@beak/app/contexts/window-session-context';
import { ipcExplorerService } from '@beak/app/lib/ipc';
import { actions } from '@beak/app/store/project';
import ksuid from '@cuvva/ksuid';
import type { MenuItemConstructorOptions } from 'electron';
import React, { useContext, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

interface ContextMenuWrapperProps {
	nodeId: string;
	mode: 'request' | 'folder';
	target: HTMLElement | undefined;
}

const ContextMenuWrapper: React.FunctionComponent<ContextMenuWrapperProps> = props => {
	const dispatch = useDispatch();
	const { nodeId, mode, target, children } = props;
	const node = useSelector(s => s.global.project.tree[nodeId]);
	const [menuItems, setMenuItems] = useState<MenuItemConstructorOptions[]>([]);
	const windowSession = useContext(WindowSessionContext);
	const darwin = windowSession.isDarwin();

	useEffect(() => {
		if (!node)
			return;

		setMenuItems([{
			id: ksuid.generate('ctxmenuitem').toString(),
			label: 'New request',
			click: () => {
				dispatch(actions.createNewRequest({ highlightedNodeId: node.id }));
			},
		}, {
			id: ksuid.generate('ctxmenuitem').toString(),
			label: 'Duplicate request',
			enabled: mode === 'request',
			click: () => {
				dispatch(actions.duplicateRequest({ requestId: nodeId }));
			},
		}, {
			id: ksuid.generate('ctxmenuitem').toString(),
			label: 'New folder',
			click: () => {
				dispatch(actions.createNewFolder({ highlightedNodeId: node.id }));
			},
		}, {
			id: ksuid.generate('ctxmenuitem').toString(),
			label: `Reveal in ${darwin ? 'Finder' : 'Explorer'}`,
			click: () => {
				ipcExplorerService.revealFile(node.filePath);
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
			click: () => ipcExplorerService.copyFullNodePath(node.filePath),
		},
		{
			id: ksuid.generate('ctxmenuitem').toString(),
			label: 'Copy relative path',
			click: () => navigator.clipboard.writeText(node.filePath),
		},

		{ id: ksuid.generate('ctxmenuitem').toString(), type: 'separator' },

		{
			id: ksuid.generate('ctxmenuitem').toString(),
			label: 'Rename',
			click: () => {
				dispatch(actions.renameStarted({ requestId: nodeId, type: mode }));
			},
		}, {
			id: ksuid.generate('ctxmenuitem').toString(),
			label: 'Delete',
			click: () => {
				dispatch(actions.removeNodeFromDisk({ requestId: node.id, withConfirmation: true }));
			},
		}]);
	}, [mode, nodeId, node]);

	return (
		<ContextMenu menuItems={menuItems} target={target}>
			{children}
		</ContextMenu>
	);
};

export default ContextMenuWrapper;
