import { IpcContextMenuServiceMain, ItemClickEventPayload, OpenContextMenuPayload } from '@beak/common/ipc/context-menu';
import { RequesterOptions, startRequester } from '@beak/requester-node';
import { BrowserWindow, ipcMain, IpcMainInvokeEvent, Menu, MenuItem } from 'electron';

const service = new IpcContextMenuServiceMain(ipcMain);

service.registerOpenContextMenu(async (event, payload: OpenContextMenuPayload) => {
	const sender = (event as IpcMainInvokeEvent).sender;
	const browserWindow = BrowserWindow.fromWebContents(sender);

	if (browserWindow === null)
		return;

	function onClick(menuItem: MenuItem) {
		service.sendItemClickEvent(sender, { id: payload.id, menuItemId: menuItem.id });
	}

	const template = payload.menuItems.map(m => ({
		...m,
		click: onClick,
	}));

	const menu = Menu.buildFromTemplate(template);

	menu.popup({
		window: browserWindow,
	});
});
