import type { MenuItemConstructorOptions } from 'electron';
import React, { useEffect } from 'react';
import ksuid from '@cuvva/ksuid';
import { ipcContextMenuService } from '@beak/app/lib/ipc';

interface ContextMenuProps {
	target: HTMLElement | undefined;
	menuItems: MenuItemConstructorOptions[];
}

const ContextMenu: React.FunctionComponent<ContextMenuProps> = props => {
	const { children, menuItems, target } = props;

	useEffect(() => {
		if (!target)
			return void 0;

		const id = ksuid.generate('ctxmenu').toString();

		async function showContextMenu() {
			ipcContextMenuService.registerItemClickEvent(async (_event, payload) => {
				if (payload.id !== id)
					return;

				const menuItem = menuItems.find(m => m.id === payload.menuItemId);

				// @ts-expect-error
				menuItem?.click?.();
			});

			await ipcContextMenuService.openContextMenu({
				id,
				menuItems: menuItems.map(m => ({
					id: m.id!,
					label: m.label,
					enabled: m.enabled,
					type: m.type,
				})),
			});
		}

		target.addEventListener('contextmenu', showContextMenu);

		return () => {
			target?.removeEventListener('contextmenu', showContextMenu);
		};
	}, [children, target, menuItems]);

	return (
		<React.Fragment>
			{children}
		</React.Fragment>
	);
};

export default ContextMenu;
