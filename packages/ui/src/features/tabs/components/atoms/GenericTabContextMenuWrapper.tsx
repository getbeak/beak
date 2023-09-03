import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import ContextMenu from '@beak/ui/components/atoms/ContextMenu';
import { useAppSelector } from '@beak/ui/store/redux';
import { renderAcceleratorDefinition } from '@beak/ui/utils/keyboard-rendering';
import { TabItem } from '@beak/common/types/beak-project';
import ksuid from '@beak/ksuid';
import type { MenuItemConstructorOptions } from 'electron';

import { closeTab, closeTabsAll, closeTabsLeft, closeTabsOther, closeTabsRight } from '../../store/actions';

interface GenericTabContextMenuWrapperProps {
	tab: TabItem;
	target: HTMLElement | undefined;
}

// eslint-disable-next-line max-len
const GenericTabContextMenuWrapper: React.FC<React.PropsWithChildren<GenericTabContextMenuWrapperProps>> = props => {
	const dispatch = useDispatch();
	const { tab, target, children } = props;
	const { activeTabs } = useAppSelector(s => s.features.tabs)!;
	const [menuItems, setMenuItems] = useState<MenuItemConstructorOptions[]>([]);

	useEffect(() => {
		const selectedIndex = activeTabs.findIndex(t => t.payload === tab.payload);
		const startTab = selectedIndex <= 0;
		const endTab = selectedIndex === activeTabs.length - 1;

		setMenuItems([
			{
				id: ksuid.generate('ctxmenuitem').toString(),
				accelerator: renderAcceleratorDefinition('tab-bar.current.close'),
				label: 'Close',
				click: () => {
					dispatch(closeTab(tab.payload));
				},
			},
			{
				id: ksuid.generate('ctxmenuitem').toString(),
				accelerator: renderAcceleratorDefinition('tab-bar.all.close-others'),
				label: 'Close others',
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
				accelerator: renderAcceleratorDefinition('tab-bar.all.close'),
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

export default GenericTabContextMenuWrapper;
