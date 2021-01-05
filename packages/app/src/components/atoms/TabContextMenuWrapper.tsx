import ContextMenu from '@beak/app/components/atoms/ContextMenu';
import { actions } from '@beak/app/store/project';
import { clipboard, MenuItemConstructorOptions } from 'electron';
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

const electron = window.require('electron');
const { ipcRenderer } = electron;

interface TabContextMenuWrapperProps {
	nodeId: string;
	target: HTMLElement | undefined;
}

const TabContextMenuWrapper: React.FunctionComponent<TabContextMenuWrapperProps> = props => {
	const dispatch = useDispatch();
	const { nodeId, target, children } = props;
	const node = useSelector(s => s.global.project.tree[nodeId]);
	const { selectedRequests, selectedRequest, projectPath } = useSelector(s => s.global.project)!;
	const [menuItems, setMenuItems] = useState<MenuItemConstructorOptions[]>([]);

	useEffect(() => {
		if (!node)
			return;

		const selectedIndex = selectedRequests.indexOf(node.id);
		const startTab = selectedIndex <= 0;
		const endTab = selectedIndex === selectedRequests.length - 1;

		setMenuItems([
			{
				label: 'Close',
				click: () => {
					dispatch(actions.closeSelectedRequest(node.id));
				},
			},
			{
				label: 'Close Others',
				click: () => {
					dispatch(actions.closeOtherSelectedRequests(node.id));
				},
			},
			{
				label: 'Close to the Right',
				enabled: !endTab,
				click: () => {
					dispatch(actions.closeSelectedRequestsToRight(node.id));
				},
			},
			{
				label: 'Close to the Left',
				enabled: !startTab,
				click: () => {
					dispatch(actions.closeSelectedRequestsToLeft(node.id));
				},
			},
			{
				label: 'Close All',
				click: () => {
					dispatch(actions.closeAllSelectedRequests());
				},
			},

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
					const relativePath = node.filePath.substring(projectPath!.length + 1);

					clipboard.writeText(relativePath);
				},
			},

			{ type: 'separator' },

			{
				label: 'Reveal in Finder',
				click: () => {
					ipcRenderer.send('misc:open_path_in_finder', node.filePath);
				},
			},
		]);
	}, [nodeId, node, selectedRequest, selectedRequests]);

	return (
		<ContextMenu menuItems={menuItems} target={target}>
			{children}
		</ContextMenu>
	);
};

export default TabContextMenuWrapper;
