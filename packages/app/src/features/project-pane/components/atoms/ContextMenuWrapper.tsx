import ContextMenu from '@beak/app/components/atoms/ContextMenu';
import { actions } from '@beak/app/store/project';
import { clipboard, MenuItemConstructorOptions } from 'electron';
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

const electron = window.require('electron');
const { ipcRenderer } = electron;

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
			label: 'Reveal in Finder',
			click: () => {
				ipcRenderer.send('misc:open_path_in_finder', node.filePath);
			},
		},

		{ type: 'separator' },

		// { role: 'copy', enabled: false },
		// { role: 'cut', enabled: false },
		// { role: 'paste', enabled: false },
		{ label: 'Copy', enabled: false },
		{ label: 'Cut', enabled: false },
		{ label: 'Paste', enabled: false },

		{ type: 'separator' },

		{
			label: 'Copy path',
			click: () => {
				clipboard.writeText(node.filePath);
			},
		},
		{
			label: 'Copy relative path',
			click: () => {
				// Is there a better way to do this lol
				const relativePath = node.filePath.substring(projectPath.length + 1);

				clipboard.writeText(relativePath);
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
