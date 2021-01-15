import { IpcBeakHubServiceRenderer } from '@beak/common/ipc/beak-hub';
import { IpcDialogServiceRenderer } from '@beak/common/ipc/dialog';
import { IpcExplorerServiceRenderer } from '@beak/common/ipc/explorer';
import { IpcNestServiceRenderer } from '@beak/common/ipc/nest';

const { ipcRenderer } = window.require('electron');

const ipcBeakHubService = new IpcBeakHubServiceRenderer(ipcRenderer);
const ipcDialogService = new IpcDialogServiceRenderer(ipcRenderer);
const ipcExplorerService = new IpcExplorerServiceRenderer(ipcRenderer);
const ipcNestService = new IpcNestServiceRenderer(ipcRenderer);

export {
	ipcBeakHubService,
	ipcDialogService,
	ipcExplorerService,
	ipcNestService,
};
