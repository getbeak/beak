import ContextMenu from '@beak/app/components/atoms/ContextMenu';
import WindowSessionContext from '@beak/app/contexts/window-session-context';
import { ipcExplorerService } from '@beak/app/lib/ipc';
import { actions } from '@beak/app/store/project';
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
	const projectPath = useSelector(s => s.global.project.projectPath)!;
	const node = useSelector(s => s.global.project.tree[nodeId]);
	const [menuItems, setMenuItems] = useState<MenuItemConstructorOptions[]>([]);
	const windowSession = useContext(WindowSessionContext);

	useEffect(() => {
		if (!node)
			return;

		setMenuItems([{
			label: 'New request',
			click: () => {
				dispatch(actions.createNewRequest({ highlightedNodeId: node.id }));
			},
		}, {
			label: 'Duplicate request',
			enabled: mode === 'request',
			click: () => {
				dispatch(actions.duplicateRequest({ requestId: nodeId }));
			},
		}, {
			label: 'New folder',
			click: () => {
				dispatch(actions.createNewFolder({ highlightedNodeId: node.id }));
			},
		}, {
			label: `Reveal in ${windowSession.isDarwin() ? 'Finder' : 'Explorer'}`,
			click: () => {
				ipcExplorerService.revealFile(node.filePath);
			},
		},

		{ type: 'separator' },

		{ label: 'Copy', enabled: false },
		{ label: 'Cut', enabled: false },
		{ label: 'Paste', enabled: false },

		{ type: 'separator' },

		{
			label: 'Copy path',
			click: () => {
				navigator.clipboard.writeText(node.filePath);
			},
		},
		{
			label: 'Copy relative path',
			click: () => {
				// Is there a better way to do this lol
				const relativePath = node.filePath.substring(projectPath.length + 1);

				navigator.clipboard.writeText(relativePath);
			},
		},

		{ type: 'separator' },

		{
			label: 'Rename',
			enabled: mode === 'request',
			click: () => {
				dispatch(actions.requestRenameStarted({ requestId: nodeId }));
			},
		}, {
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
