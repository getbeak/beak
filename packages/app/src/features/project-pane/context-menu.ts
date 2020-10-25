import { actions } from '@beak/app/store/context-menus';
import { Dispatch } from '@reduxjs/toolkit';

const { remote } = window.require('electron');
const { Menu, MenuItem } = remote;

export function createExplorerMenu(dispatch: Dispatch, id: string | undefined) {
	if (!id)
		return null;

	const explorerMenu = new Menu();

	explorerMenu.append(new MenuItem({
		label: 'New request',
		click: () => {
			dispatch(actions.executeCommand({ type: 'create_new_request', payload: id }));
		},
	}));

	explorerMenu.append(new MenuItem({
		label: 'New folder',
		click: () => {

		},
	}));

	explorerMenu.append(new MenuItem({
		label: 'Reveal in Finder',
		click: () => {
			dispatch(actions.executeCommand({ type: 'reveal_in_finder', payload: id }));
		},
	}));

	explorerMenu.append(new MenuItem({ type: 'separator' }));
	explorerMenu.append(new MenuItem({ role: 'copy', enabled: false }));
	explorerMenu.append(new MenuItem({ role: 'paste', enabled: false }));
	explorerMenu.append(new MenuItem({ type: 'separator' }));
	explorerMenu.append(new MenuItem({ label: 'Copy path', enabled: false }));
	explorerMenu.append(new MenuItem({ label: 'Copy relative path', enabled: false }));
	explorerMenu.append(new MenuItem({ type: 'separator' }));
	explorerMenu.append(new MenuItem({ label: 'Rename', enabled: false }));
	explorerMenu.append(new MenuItem({ label: 'Delete', enabled: false }));

	return explorerMenu;
}
