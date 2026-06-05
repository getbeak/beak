import type { MenuItemConstructorOptions } from 'electron';

import { contextMenuController } from '../components/molecules/ContextMenuHost';

/**
 * Open a context menu at the cursor. Items use Electron's
 * `MenuItemConstructorOptions` shape so call sites built against the old
 * native-menu plumbing keep working — only the renderer behind it changed.
 *
 * The first argument is a stable id; it used to disambiguate IPC click
 * events from concurrent menus, and is now unused but retained for API
 * compatibility. Calls fire the `click` handler on the selected item
 * directly — no IPC roundtrip.
 */
export function showContextMenu(_id: string, menuItems: MenuItemConstructorOptions[]) {
	const pos = lastCursorPosition();
	contextMenuController.open(menuItems, pos.x, pos.y);
}

let lastPos = { x: 0, y: 0 };

if (typeof window !== 'undefined') {
	window.addEventListener(
		'mousemove',
		event => {
			lastPos = { x: event.clientX, y: event.clientY };
		},
		true,
	);
	window.addEventListener(
		'contextmenu',
		event => {
			lastPos = { x: event.clientX, y: event.clientY };
		},
		true,
	);
}

function lastCursorPosition() {
	return lastPos;
}
