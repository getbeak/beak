import ContextMenu from '@beak/app/components/atoms/ContextMenu';
import { isDarwin } from '@beak/app/globals';
import { ipcExplorerService } from '@beak/app/lib/ipc';
import { actions } from '@beak/app/store/project';
import { TabItem } from '@beak/common/types/beak-project';
import { clipboard, MenuItemConstructorOptions } from 'electron';
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

interface RequestTabContextMenuWrapperProps {
	tab: TabItem;
	target: HTMLElement | undefined;
}

const RequestTabContextMenuWrapper: React.FunctionComponent<RequestTabContextMenuWrapperProps> = props => {
	const dispatch = useDispatch();
	const { tab, target, children } = props;
	const node = useSelector(s => s.global.project.tree[tab.payload]);
	const { tabs, selectedTabPayload, projectPath } = useSelector(s => s.global.project)!;
	const [menuItems, setMenuItems] = useState<MenuItemConstructorOptions[]>([]);

	useEffect(() => {
		if (!node)
			return;

		const isRequestTab = tab.type === 'request';
		const selectedIndex = tabs.findIndex(t => t.payload === node.id);
		const startTab = selectedIndex <= 0;
		const endTab = selectedIndex === tabs.length - 1;

		setMenuItems([
			{
				label: 'Close',
				click: () => {
					dispatch(actions.closeSelectedTab(node.id));
				},
			},
			{
				label: 'Close Others',
				click: () => {
					dispatch(actions.closeOtherSelectedTabs(node.id));
				},
			},
			{
				label: 'Close to the Right',
				enabled: !endTab,
				click: () => {
					dispatch(actions.closeSelectedTabsToRight(node.id));
				},
			},
			{
				label: 'Close to the Left',
				enabled: !startTab,
				click: () => {
					dispatch(actions.closeSelectedTabsToLeft(node.id));
				},
			},
			{
				label: 'Close All',
				click: () => {
					dispatch(actions.closeAllSelectedTabs());
				},
			},

			{ type: 'separator' },

			{
				label: 'Copy path',
				enabled: isRequestTab,
				click: () => {
					clipboard.writeText(node.filePath);
				},
			},
			{
				label: 'Copy relative path',
				enabled: isRequestTab,
				click: () => {
					// Is there a better way to do this lol
					const relativePath = node.filePath.substring(projectPath!.length + 1);

					clipboard.writeText(relativePath);
				},
			},

			{ type: 'separator' },

			{
				label: `Reveal in ${isDarwin() ? 'Finder' : 'Explorer'}`,
				enabled: isRequestTab,
				click: () => {
					ipcExplorerService.revealFile(node.filePath);
				},
			},
		]);
	}, [tab, node, selectedTabPayload, tabs]);

	return (
		<ContextMenu menuItems={menuItems} target={target}>
			{children}
		</ContextMenu>
	);
};

export default RequestTabContextMenuWrapper;
