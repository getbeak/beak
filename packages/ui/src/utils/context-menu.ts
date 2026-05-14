import type { MenuItemConstructorOptions } from 'electron';

import { ipcContextMenuService } from '../lib/ipc';

export function showContextMenu(id: string, menuItems: MenuItemConstructorOptions[]) {
	ipcContextMenuService.registerItemClickEvent(async (_event, payload) => {
		if (payload.id !== id) return;

		const menuItem = menuItems.find(m => m.id === payload.menuItemId);

		(menuItem?.click as (() => void) | undefined)?.();
	});

	ipcContextMenuService.openContextMenu({
		id,
		menuItems: menuItems.map(m => ({
			id: m.id!,
			type: m.type,
			label: m.label,
			enabled: m.enabled,
			accelerator: m.accelerator,
		})),
	});
}
