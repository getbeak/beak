import { MenuItemConstructorOptions, remote } from 'electron';
import React, { useEffect } from 'react';

// const remote = window.require('electron');
const { Menu } = remote;

interface ContextMenuProps {
	target: HTMLElement | undefined;
	menuItems: MenuItemConstructorOptions[];
}

const ContextMenu: React.FunctionComponent<ContextMenuProps> = props => {
	const { children, menuItems, target } = props;

	useEffect(() => {
		if (!target)
			return void 0;

		const menu = Menu.buildFromTemplate(menuItems);

		function showContextMenu() {
			menu.popup();
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
