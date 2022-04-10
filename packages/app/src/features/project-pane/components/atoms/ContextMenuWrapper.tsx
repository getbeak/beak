import React, { useContext, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import ContextMenu from '@beak/app/components/atoms/ContextMenu';
import WindowSessionContext from '@beak/app/contexts/window-session-context';
import { ipcExplorerService } from '@beak/app/lib/ipc';
import { actions } from '@beak/app/store/project';
import ksuid from '@cuvva/ksuid';
import type { MenuItemConstructorOptions } from 'electron';

interface ContextMenuWrapperProps {
	nodeId?: string;
	mode: 'request' | 'folder' | 'root';
	target: HTMLElement | undefined;
}

const ContextMenuWrapper: React.FunctionComponent<ContextMenuWrapperProps> = props => {
	const dispatch = useDispatch();
	const { nodeId, mode, target, children } = props;

	// @ts-expect-error
	const node = useSelector(s => s.global.project.tree[nodeId]);
	const id = useSelector(s => s.global.project.id)!;
	const [menuItems, setMenuItems] = useState<MenuItemConstructorOptions[]>([]);
	const windowSession = useContext(WindowSessionContext);
	const darwin = windowSession.isDarwin();
	const root = mode === 'root';
	const notRoot = mode !== 'root';

	useEffect(() => {
		if (!node && notRoot)
			return;

		setMenuItems([{
			id: ksuid.generate('ctxmenuitem').toString(),
			accelerator: 'CmdOrCtrl+Shift+N',
			label: 'New request',
			click: () => {
				dispatch(actions.createNewRequest({ highlightedNodeId: node?.id }));
			},
		}, {
			id: ksuid.generate('ctxmenuitem').toString(),
			label: 'Duplicate request',
			accelerator: 'CmdOrCtrl+D',
			enabled: mode === 'request',
			click: () => {
				dispatch(actions.duplicateRequest({ requestId: nodeId! }));
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
			enabled: notRoot,
			click: () => {
				ipcExplorerService.revealFile(node.filePath);
			},
		},

		{ id: ksuid.generate('ctxmenuitem').toString(), type: 'separator' },

		{
			id: ksuid.generate('ctxmenuitem').toString(),
			label: 'Copy request share link',
			enabled: mode === 'request',
			click: async () => {
				const search = new URLSearchParams({ requestId: nodeId! });
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
			enabled: notRoot,
			click: () => ipcExplorerService.copyFullNodePath(node.filePath),
		},
		{
			id: ksuid.generate('ctxmenuitem').toString(),
			label: 'Copy relative path',
			enabled: notRoot,
			click: () => navigator.clipboard.writeText(node.filePath),
		},

		{ id: ksuid.generate('ctxmenuitem').toString(), type: 'separator' },

		{
			id: ksuid.generate('ctxmenuitem').toString(),
			label: 'Rename',
			accelerator: darwin ? 'Return' : 'F2',
			enabled: notRoot,
			click: () => {
				if (root)
					return;

				dispatch(actions.renameStarted({ requestId: nodeId!, type: mode }));
			},
		}, {
			id: ksuid.generate('ctxmenuitem').toString(),
			label: 'Delete',
			accelerator: 'CmdOrCtrl+Backspace',
			enabled: notRoot,
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
