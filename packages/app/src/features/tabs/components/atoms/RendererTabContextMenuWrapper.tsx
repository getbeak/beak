import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import ContextMenu from '@beak/app/components/atoms/ContextMenu';
import { TabItem } from '@beak/common/types/beak-project';
import ksuid from '@cuvva/ksuid';
import type { MenuItemConstructorOptions } from 'electron';

import { closeTab, closeTabsAll, closeTabsLeft, closeTabsOther, closeTabsRight } from '../../store/actions';

interface RendererTabContextMenuWrapperProps {
	tab: TabItem;
	target: HTMLElement | undefined;
}

const RendererTabContextMenuWrapper: React.FunctionComponent<RendererTabContextMenuWrapperProps> = props => {
	const dispatch = useDispatch();
	const { tab, target, children } = props;
	const { activeTabs } = useSelector(s => s.features.tabs)!;
	const [menuItems, setMenuItems] = useState<MenuItemConstructorOptions[]>([]);

	useEffect(() => {
		const selectedIndex = activeTabs.findIndex(t => t.payload === tab.payload);
		const startTab = selectedIndex <= 0;
		const endTab = selectedIndex === activeTabs.length - 1;

		setMenuItems([
			{
				id: ksuid.generate('ctxmenuitem').toString(),
				label: 'Close',
				click: () => {
					dispatch(closeTab(tab.payload));
				},
			},
			{
				id: ksuid.generate('ctxmenuitem').toString(),
				label: 'Close Others',
				click: () => {
					dispatch(closeTabsOther(tab.payload));
				},
			},
			{
				id: ksuid.generate('ctxmenuitem').toString(),
				label: 'Close to the Right',
				enabled: !endTab,
				click: () => {
					dispatch(closeTabsRight(tab.payload));
				},
			},
			{
				id: ksuid.generate('ctxmenuitem').toString(),
				label: 'Close to the Left',
				enabled: !startTab,
				click: () => {
					dispatch(closeTabsLeft(tab.payload));
				},
			},
			{
				id: ksuid.generate('ctxmenuitem').toString(),
				label: 'Close All',
				click: () => {
					dispatch(closeTabsAll());
				},
			},

			{ type: 'separator' },
		]);
	}, [tab, activeTabs]);

	return (
		<ContextMenu menuItems={menuItems} target={target}>
			{children}
		</ContextMenu>
	);
};

export default RendererTabContextMenuWrapper;
