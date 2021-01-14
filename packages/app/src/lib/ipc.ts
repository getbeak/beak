import { IpcDialogServiceRenderer } from '@beak/common/ipc/dialog';

const { ipcRenderer } = window.require('electron');

const ipcDialogService = new IpcDialogServiceRenderer(ipcRenderer);

export {
	ipcDialogService,
};
