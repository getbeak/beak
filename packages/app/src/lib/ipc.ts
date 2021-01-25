import { IpcBeakHubServiceRenderer } from '@beak/common/ipc/beak-hub';
import { IpcDialogServiceRenderer } from '@beak/common/ipc/dialog';
import { IpcEncryptionServiceRenderer } from '@beak/common/ipc/encryption';
import { IpcExplorerServiceRenderer } from '@beak/common/ipc/explorer';
import { IpcFlightServiceRenderer } from '@beak/common/ipc/flight';
import { IpcNestServiceRenderer } from '@beak/common/ipc/nest';
import { IpcProjectServiceRenderer } from '@beak/common/ipc/project';

const { ipcRenderer } = window.require('electron');

const ipcBeakHubService = new IpcBeakHubServiceRenderer(ipcRenderer);
const ipcDialogService = new IpcDialogServiceRenderer(ipcRenderer);
const ipcEncryptionService = new IpcEncryptionServiceRenderer(ipcRenderer);
const ipcExplorerService = new IpcExplorerServiceRenderer(ipcRenderer);
const ipcFlightService = new IpcFlightServiceRenderer(ipcRenderer);
const ipcNestService = new IpcNestServiceRenderer(ipcRenderer);
const ipcProjectService = new IpcProjectServiceRenderer(ipcRenderer);

export {
	ipcBeakHubService,
	ipcDialogService,
	ipcEncryptionService,
	ipcExplorerService,
	ipcFlightService,
	ipcNestService,
	ipcProjectService,
};
