import type { TabItem } from '@beak/common/types/beak-project';
import ContextMenu from '@beak/ui/components/atoms/ContextMenu';
import WindowSessionContext from '@beak/ui/contexts/window-session-context';
import { ipcExplorerService } from '@beak/ui/lib/ipc';
import { closeTabIntent } from '@beak/ui/store/project/actions';
import { useAppSelector } from '@beak/ui/store/redux';
import { renderAcceleratorDefinition } from '@beak/ui/utils/keyboard-rendering';
import type { MenuItemConstructorOptions } from 'electron';
import React, { useContext, useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useTabPresentation } from '../../contexts/tab-presentation';
import { closeTabsAll, closeTabsLeft, closeTabsOther, closeTabsRight } from '../../store/actions';

interface RequestTabContextMenuWrapperProps {
	tab: TabItem;
	target: HTMLElement | undefined;
}

const RequestTabContextMenuWrapper: React.FC<React.PropsWithChildren<RequestTabContextMenuWrapperProps>> = props => {
	const dispatch = useDispatch();
	const { tab, target, children } = props;
	const node = useAppSelector(s => s.global.project.tree[tab.payload]);
	const { activeTabs } = useAppSelector(s => s.features.tabs)!;
	const [menuItems, setMenuItems] = useState<MenuItemConstructorOptions[]>([]);
	const windowSession = useContext(WindowSessionContext);
	const presentation = useTabPresentation();

	useEffect(() => {
		if (!node) return;

		const isRequestTab = tab.type === 'request';
		const selectedIndex = activeTabs.findIndex(t => t.payload === node.id);
		const startTab = selectedIndex <= 0;
		const endTab = selectedIndex === activeTabs.length - 1;
		const rawEditing = presentation.isRawEditing(node.id);

		setMenuItems([
			{
				id: 'request-tab-ctx:edit-raw',
				label: rawEditing ? 'Close raw editor' : 'Edit raw JSON…',
				enabled: isRequestTab,
				click: () => {
					if (rawEditing) presentation.exitRawEdit(node.id);
					else presentation.enterRawEdit(node.id);
				},
			},

			{ id: 'request-tab-ctx:sep-0', type: 'separator' },

			{
				id: 'request-tab-ctx:close',
				accelerator: renderAcceleratorDefinition('tab-bar.current.close'),
				label: 'Close',
				click: () => {
					dispatch(closeTabIntent(node.id));
				},
			},
			{
				id: 'request-tab-ctx:close-others',
				accelerator: renderAcceleratorDefinition('tab-bar.all.close-others'),
				label: 'Close Others',
				click: () => {
					dispatch(closeTabsOther(node.id));
				},
			},
			{
				id: 'request-tab-ctx:close-right',
				label: 'Close to the Right',
				enabled: !endTab,
				click: () => {
					dispatch(closeTabsRight(node.id));
				},
			},
			{
				id: 'request-tab-ctx:close-left',
				label: 'Close to the Left',
				enabled: !startTab,
				click: () => {
					dispatch(closeTabsLeft(node.id));
				},
			},
			{
				id: 'request-tab-ctx:close-all',
				accelerator: renderAcceleratorDefinition('tab-bar.all.close'),
				label: 'Close All',
				click: () => {
					dispatch(closeTabsAll());
				},
			},

			{ id: 'request-tab-ctx:sep-1', type: 'separator' },

			{
				id: 'request-tab-ctx:copy-path',
				label: 'Copy Path',
				enabled: isRequestTab,
				click: () => ipcExplorerService.copyFullNodePath(node.filePath),
			},
			{
				id: 'request-tab-ctx:copy-relative-path',
				label: 'Copy Relative Path',
				enabled: isRequestTab,
				click: () => navigator.clipboard.writeText(node.filePath),
			},

			{ id: 'request-tab-ctx:sep-2', type: 'separator' },

			{
				id: 'request-tab-ctx:reveal',
				label: `Reveal in ${windowSession.isDarwin() ? 'Finder' : 'Explorer'}`,
				enabled: isRequestTab,
				click: () => {
					ipcExplorerService.revealFile(node.filePath);
				},
			},
		]);
	}, [tab, node, activeTabs, dispatch, windowSession, presentation]);

	return (
		<ContextMenu menuItems={menuItems} target={target}>
			{children}
		</ContextMenu>
	);
};

export default RequestTabContextMenuWrapper;
