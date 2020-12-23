import ContextMenu from '@beak/app/components/atoms/ContextMenu';
import { actions } from '@beak/app/store/context-menus';
import { actions as projectActions } from '@beak/app/store/project';
import { MenuItemConstructorOptions } from 'electron';
import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';

interface ContextMenuWrapperProps {
	nodeId: string;
	mode: 'request' | 'folder';
	target: HTMLElement | undefined;
}

const ContextMenuWrapper: React.FunctionComponent<ContextMenuWrapperProps> = props => {
	const dispatch = useDispatch();
	const { nodeId, mode, target, children } = props;
	const [menuItems, setMenuItems] = useState<MenuItemConstructorOptions[]>([]);

	useEffect(() => {
		setMenuItems([{
			label: 'New request',
			click: () => {
				dispatch(actions.executeCommand({ type: 'create_new_request', payload: nodeId }));
			},
		}, {
			label: 'Duplicate request',
			enabled: mode === 'request',
			click: () => {
				dispatch(projectActions.duplicateRequest({ requestId: nodeId }));
			},
		}, {
			label: 'New folder',
			click: () => {
				dispatch(actions.executeCommand({ type: 'create_new_folder', payload: nodeId }));
			},
		}, {
			label: 'Reveal in Finder',
			click: () => {
				dispatch(actions.executeCommand({ type: 'reveal_in_finder', payload: nodeId }));
			},
		},

		{ type: 'separator' },

		{ role: 'copy', enabled: false },
		{ role: 'cut', enabled: false },
		{ role: 'paste', enabled: false },

		{ type: 'separator' },

		{ label: 'Copy path', enabled: false },
		{ label: 'Copy relative path', enabled: false },

		{ type: 'separator' },

		{
			label: 'Rename',
			enabled: mode === 'request',
			click: () => {
				dispatch(projectActions.requestRenameStarted({ requestId: nodeId }));
			},
		}, {
			label: 'Delete',
			enabled: mode === 'request',
			click: () => {
				dispatch(actions.executeCommand({ type: 'delete_request', payload: nodeId }));
			},
		}]);
	}, []);

	return (
		<ContextMenu menuItems={menuItems} target={target}>
			{children}
		</ContextMenu>
	);
};

export default ContextMenuWrapper;
