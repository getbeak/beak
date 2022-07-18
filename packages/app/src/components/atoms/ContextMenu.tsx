import React, { useEffect } from 'react';
import { showContextMenu } from '@beak/app/utils/context-menu';
import ksuid from '@beak/ksuid';
import type { MenuItemConstructorOptions } from 'electron';

interface ContextMenuProps {
	target: HTMLElement | undefined;
	menuItems: MenuItemConstructorOptions[];
}

const ContextMenu: React.FC<React.PropsWithChildren<ContextMenuProps>> = props => {
	const { children, menuItems, target } = props;

	useEffect(() => {
		if (!target)
			return void 0;

		const id = ksuid.generate('ctxmenu').toString();

		function handleContextMenu(event: MouseEvent) {
			event.preventDefault();
			event.stopPropagation();

			showContextMenu(id, menuItems);
		}

		target.addEventListener('contextmenu', handleContextMenu);

		return () => {
			target?.removeEventListener('contextmenu', handleContextMenu);
		};
	}, [children, target, menuItems]);

	return (
		<React.Fragment>
			{children}
		</React.Fragment>
	);
};

export default ContextMenu;
