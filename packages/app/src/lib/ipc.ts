import { PartialIpcRenderer } from '@beak/common/ipc/ipc';

import { IpcAppServiceRenderer } from '@beak/common/ipc/app';
import { IpcArbiterServiceRenderer } from '@beak/common/ipc/arbiter';
import { IpcBeakHubServiceRenderer } from '@beak/common/ipc/beak-hub';
import { IpcDialogServiceRenderer } from '@beak/common/ipc/dialog';
import { IpcEncryptionServiceRenderer } from '@beak/common/ipc/encryption';
import { IpcExplorerServiceRenderer } from '@beak/common/ipc/explorer';
import { IpcFlightServiceRenderer } from '@beak/common/ipc/flight';
import { IpcFsServiceRenderer } from '@beak/common/ipc/fs';
import { IpcFsWatcherServiceRenderer } from '@beak/common/ipc/fs-watcher';
import { IpcNestServiceRenderer } from '@beak/common/ipc/nest';
import { IpcNotificationServiceRenderer } from '@beak/common/ipc/notification';
import { IpcProjectServiceRenderer } from '@beak/common/ipc/project';
import { IpcWindowServiceRenderer } from '@beak/common/ipc/window';

const partialIpcRenderer: PartialIpcRenderer = {
	on: window.secureBridge.ipc.on,
	invoke: window.secureBridge.ipc.invoke,
};

const ipcAppService = new IpcAppServiceRenderer(partialIpcRenderer);
const ipcArbiterService = new IpcArbiterServiceRenderer(partialIpcRenderer);
const ipcBeakHubService = new IpcBeakHubServiceRenderer(partialIpcRenderer);
const ipcDialogService = new IpcDialogServiceRenderer(partialIpcRenderer);
const ipcEncryptionService = new IpcEncryptionServiceRenderer(partialIpcRenderer);
const ipcExplorerService = new IpcExplorerServiceRenderer(partialIpcRenderer);
const ipcFlightService = new IpcFlightServiceRenderer(partialIpcRenderer);
const ipcFsService = new IpcFsServiceRenderer(partialIpcRenderer);
const ipcFsWatcherService = new IpcFsWatcherServiceRenderer(partialIpcRenderer);
const ipcNestService = new IpcNestServiceRenderer(partialIpcRenderer);
const ipcNotificationService = new IpcNotificationServiceRenderer(partialIpcRenderer);
const ipcProjectService = new IpcProjectServiceRenderer(partialIpcRenderer);
const ipcWindowService = new IpcWindowServiceRenderer(partialIpcRenderer);

export {
	ipcAppService,
	ipcArbiterService,
	ipcBeakHubService,
	ipcDialogService,
	ipcEncryptionService,
	ipcExplorerService,
	ipcFlightService,
	ipcFsService,
	ipcFsWatcherService,
	ipcNestService,
	ipcNotificationService,
	ipcProjectService,
	ipcWindowService,
};
