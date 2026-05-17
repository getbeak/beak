import { IpcContextMenuServiceMain, type OpenContextMenuPayload } from '@beak/common/ipc/context-menu';

import { webIpcMain } from './ipc';

const service = new IpcContextMenuServiceMain(webIpcMain);

// Electron's main process opens the native menu at the OS cursor. On the web
// the IPC payload doesn't carry x/y, so we track the cursor here and use the
// most recent position when a menu is requested.
let lastPos = { x: 0, y: 0 };
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

service.registerOpenContextMenu(async (_event, payload: OpenContextMenuPayload) => {
	openDomContextMenu({
		items: payload.menuItems,
		x: lastPos.x,
		y: lastPos.y,
		onSelect: menuItemId => {
			service.sendItemClickEvent(webIpcMain.webContents, { id: payload.id, menuItemId });
		},
	});
});

interface OpenArgs {
	items: OpenContextMenuPayload['menuItems'];
	x: number;
	y: number;
	onSelect: (menuItemId: string) => void;
}

let activeMenu: HTMLElement | null = null;

function closeActiveMenu() {
	if (!activeMenu) return;
	activeMenu.remove();
	activeMenu = null;
	document.removeEventListener('mousedown', onOutsideMouse, true);
	document.removeEventListener('keydown', onKey, true);
	document.removeEventListener('scroll', closeActiveMenu, true);
	window.removeEventListener('blur', closeActiveMenu);
	window.removeEventListener('resize', closeActiveMenu);
}

function onOutsideMouse(event: MouseEvent) {
	if (activeMenu && !activeMenu.contains(event.target as Node)) closeActiveMenu();
}

function onKey(event: KeyboardEvent) {
	if (event.key === 'Escape') closeActiveMenu();
}

function openDomContextMenu({ items, x, y, onSelect }: OpenArgs): void {
	closeActiveMenu();

	const container = document.getElementById('context-menu-container') ?? document.body;
	const menu = document.createElement('div');
	menu.setAttribute('role', 'menu');
	menu.style.cssText = `
		position: fixed;
		min-width: 180px;
		max-width: 320px;
		padding: 4px;
		background: var(--beak-colors-bg-surface);
		color: var(--beak-colors-fg-default);
		border: 1px solid var(--beak-colors-border-default);
		border-radius: 8px;
		box-shadow: 0 12px 28px rgba(0,0,0,0.22), 0 4px 10px rgba(0,0,0,0.12), inset 0 1px 0 color-mix(in srgb, white 8%, transparent);
		font-family: var(--beak-fonts-body);
		font-size: 13px;
		z-index: 9999;
		visibility: hidden;
		user-select: none;
	`;

	for (const item of items) {
		if (item.type === 'separator') {
			const sep = document.createElement('div');
			sep.style.cssText = 'height:1px;margin:4px 4px;background:var(--beak-colors-border-subtle);';
			menu.appendChild(sep);
			continue;
		}

		const row = document.createElement('div');
		row.setAttribute('role', 'menuitem');
		const disabled = item.enabled === false;
		row.style.cssText = `
			display: flex;
			align-items: center;
			justify-content: space-between;
			gap: 16px;
			padding: 5px 9px;
			border-radius: 5px;
			color: ${disabled ? 'var(--beak-colors-fg-disabled)' : 'var(--beak-colors-fg-default)'};
			cursor: ${disabled ? 'not-allowed' : 'default'};
			line-height: 1.2;
		`;

		const label = document.createElement('span');
		label.textContent = String(item.label ?? '');
		row.appendChild(label);

		if (item.accelerator) {
			const accel = document.createElement('span');
			accel.textContent = String(item.accelerator);
			accel.style.cssText = 'font-size:11px;color:var(--beak-colors-fg-subtle);font-family:var(--beak-fonts-mono);';
			row.appendChild(accel);
		}

		if (!disabled) {
			row.addEventListener('mouseenter', () => {
				row.style.background = 'var(--beak-colors-accent-pink)';
				row.style.color = 'var(--beak-colors-fg-onAccent)';
				if (item.accelerator)
					(row.lastChild as HTMLElement).style.color = 'color-mix(in srgb, var(--beak-colors-fg-onAccent) 80%, transparent)';
			});
			row.addEventListener('mouseleave', () => {
				row.style.background = '';
				row.style.color = 'var(--beak-colors-fg-default)';
				if (item.accelerator) (row.lastChild as HTMLElement).style.color = 'var(--beak-colors-fg-subtle)';
			});
			row.addEventListener('click', () => {
				closeActiveMenu();
				onSelect(item.id);
			});
		}

		menu.appendChild(row);
	}

	container.appendChild(menu);
	activeMenu = menu;

	// Measure once mounted, then clamp inside the viewport.
	const rect = menu.getBoundingClientRect();
	const maxX = window.innerWidth - rect.width - 4;
	const maxY = window.innerHeight - rect.height - 4;
	menu.style.left = `${Math.max(4, Math.min(x, maxX))}px`;
	menu.style.top = `${Math.max(4, Math.min(y, maxY))}px`;
	menu.style.visibility = 'visible';

	document.addEventListener('mousedown', onOutsideMouse, true);
	document.addEventListener('keydown', onKey, true);
	document.addEventListener('scroll', closeActiveMenu, true);
	window.addEventListener('blur', closeActiveMenu);
	window.addEventListener('resize', closeActiveMenu);
}
