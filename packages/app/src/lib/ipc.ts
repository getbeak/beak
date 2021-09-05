import { PartialIpcRenderer } from '@beak/common/ipc/ipc';

import { IpcAppServiceRenderer } from '@beak/common/ipc/app';
import { IpcArbiterServiceRenderer } from '@beak/common/ipc/arbiter';
import { IpcBeakHubServiceRenderer } from '@beak/common/ipc/beak-hub';
import { IpcContextMenuServiceRenderer } from '@beak/common/ipc/context-menu';
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

export const ipcAppService = new IpcAppServiceRenderer(partialIpcRenderer);
export const ipcArbiterService = new IpcArbiterServiceRenderer(partialIpcRenderer);
export const ipcBeakHubService = new IpcBeakHubServiceRenderer(partialIpcRenderer);
export const ipcContextMenuService = new IpcContextMenuServiceRenderer(partialIpcRenderer);
export const ipcDialogService = new IpcDialogServiceRenderer(partialIpcRenderer);
export const ipcEncryptionService = new IpcEncryptionServiceRenderer(partialIpcRenderer);
export const ipcExplorerService = new IpcExplorerServiceRenderer(partialIpcRenderer);
export const ipcFlightService = new IpcFlightServiceRenderer(partialIpcRenderer);
export const ipcFsService = new IpcFsServiceRenderer(partialIpcRenderer);
export const ipcFsWatcherService = new IpcFsWatcherServiceRenderer(partialIpcRenderer);
export const ipcNestService = new IpcNestServiceRenderer(partialIpcRenderer);
export const ipcNotificationService = new IpcNotificationServiceRenderer(partialIpcRenderer);
export const ipcProjectService = new IpcProjectServiceRenderer(partialIpcRenderer);
export const ipcWindowService = new IpcWindowServiceRenderer(partialIpcRenderer);
