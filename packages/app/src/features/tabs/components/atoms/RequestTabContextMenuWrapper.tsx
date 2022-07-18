import React, { useContext, useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import ContextMenu from '@beak/app/components/atoms/ContextMenu';
import WindowSessionContext from '@beak/app/contexts/window-session-context';
import { ipcExplorerService } from '@beak/app/lib/ipc';
import { useAppSelector } from '@beak/app/store/redux';
import { TabItem } from '@beak/common/types/beak-project';
import ksuid from '@beak/ksuid';
import type { MenuItemConstructorOptions } from 'electron';

import { closeTab, closeTabsAll, closeTabsLeft, closeTabsOther, closeTabsRight } from '../../store/actions';

interface RequestTabContextMenuWrapperProps {
	tab: TabItem;
	target: HTMLElement | undefined;
}

// eslint-disable-next-line max-len
const RequestTabContextMenuWrapper: React.FC<React.PropsWithChildren<RequestTabContextMenuWrapperProps>> = props => {
	const dispatch = useDispatch();
	const { tab, target, children } = props;
	const node = useAppSelector(s => s.global.project.tree[tab.payload]);
	const { activeTabs } = useAppSelector(s => s.features.tabs)!;
	const [menuItems, setMenuItems] = useState<MenuItemConstructorOptions[]>([]);
	const windowSession = useContext(WindowSessionContext);

	useEffect(() => {
		if (!node)
			return;

		const isRequestTab = tab.type === 'request';
		const selectedIndex = activeTabs.findIndex(t => t.payload === node.id);
		const startTab = selectedIndex <= 0;
		const endTab = selectedIndex === activeTabs.length - 1;

		setMenuItems([
			{
				id: ksuid.generate('ctxmenuitem').toString(),
				accelerator: 'CmdOrCtrl+W',
				label: 'Close',
				click: () => {
					dispatch(closeTab(node.id));
				},
			},
			{
				id: ksuid.generate('ctxmenuitem').toString(),
				accelerator: 'CmdOrCtrl+Alt+T',
				label: 'Close Others',
				click: () => {
					dispatch(closeTabsOther(node.id));
				},
			},
			{
				id: ksuid.generate('ctxmenuitem').toString(),
				label: 'Close to the Right',
				enabled: !endTab,
				click: () => {
					dispatch(closeTabsRight(node.id));
				},
			},
			{
				id: ksuid.generate('ctxmenuitem').toString(),
				label: 'Close to the Left',
				enabled: !startTab,
				click: () => {
					dispatch(closeTabsLeft(node.id));
				},
			},
			{
				id: ksuid.generate('ctxmenuitem').toString(),
				label: 'Close All',
				click: () => {
					dispatch(closeTabsAll());
				},
			},

			{ id: ksuid.generate('ctxmenuitem').toString(), type: 'separator' },

			{
				id: ksuid.generate('ctxmenuitem').toString(),
				label: 'Copy path',
				enabled: isRequestTab,
				click: () => ipcExplorerService.copyFullNodePath(node.filePath),
			},
			{
				id: ksuid.generate('ctxmenuitem').toString(),
				label: 'Copy relative path',
				enabled: isRequestTab,
				click: () => navigator.clipboard.writeText(node.filePath),
			},

			{ id: ksuid.generate('ctxmenuitem').toString(), type: 'separator' },

			{
				id: ksuid.generate('ctxmenuitem').toString(),
				label: `Reveal in ${windowSession.isDarwin() ? 'Finder' : 'Explorer'}`,
				enabled: isRequestTab,
				click: () => {
					ipcExplorerService.revealFile(node.filePath);
				},
			},
		]);
	}, [tab, node, activeTabs]);

	return (
		<ContextMenu menuItems={menuItems} target={target}>
			{children}
		</ContextMenu>
	);
};

export default RequestTabContextMenuWrapper;
