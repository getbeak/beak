import React, { useEffect } from 'react';
import { ipcContextMenuService } from '@beak/app/lib/ipc';
import ksuid from '@cuvva/ksuid';
import type { MenuItemConstructorOptions } from 'electron';

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

		function showContextMenu(event: MouseEvent) {
			event.preventDefault();
			event.stopPropagation();

			ipcContextMenuService.registerItemClickEvent(async (_event, payload) => {
				if (payload.id !== id)
					return;

				const menuItem = menuItems.find(m => m.id === payload.menuItemId);

				// @ts-expect-error
				menuItem?.click?.();
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
