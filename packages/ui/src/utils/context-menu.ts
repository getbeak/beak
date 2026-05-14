import type { MenuItemConstructorOptions } from 'electron';

import { ipcContextMenuService } from '../lib/ipc';

// Per-id click handlers, registered while a context menu is open. Without
// this registry, calling registerItemClickEvent on every showContextMenu
// invocation leaks a fresh IPC listener every time the user opens a menu
// (the main process keeps re-emitting to every accumulated handler).
const pendingHandlers = new Map<string, MenuItemConstructorOptions[]>();
let installed = false;

function installOnce() {
	if (installed) return;
	installed = true;

	ipcContextMenuService.registerItemClickEvent(async (_event, payload) => {
		const items = pendingHandlers.get(payload.id);
		pendingHandlers.delete(payload.id);
		if (!items) return;

		const menuItem = items.find(m => m.id === payload.menuItemId);

		(menuItem?.click as (() => void) | undefined)?.();
	});
}

export function showContextMenu(id: string, menuItems: MenuItemConstructorOptions[]) {
	installOnce();
	pendingHandlers.set(id, menuItems);

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
