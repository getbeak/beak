import { IpcAppServiceRenderer } from '@beak/shared-common/ipc/app';
import { IpcArbiterServiceRenderer } from '@beak/shared-common/ipc/arbiter';
import { IpcBeakHubServiceRenderer } from '@beak/shared-common/ipc/beak-hub';
import { IpcContextMenuServiceRenderer } from '@beak/shared-common/ipc/context-menu';
import { IpcDialogServiceRenderer } from '@beak/shared-common/ipc/dialog';
import { IpcEncryptionServiceRenderer } from '@beak/shared-common/ipc/encryption';
import { IpcExplorerServiceRenderer } from '@beak/shared-common/ipc/explorer';
import { IpcFlightServiceRenderer } from '@beak/shared-common/ipc/flight';
import { IpcFsServiceRenderer } from '@beak/shared-common/ipc/fs';
import { IpcFsWatcherServiceRenderer } from '@beak/shared-common/ipc/fs-watcher';
import { PartialIpcRenderer } from '@beak/shared-common/ipc/ipc';
import { IpcNestServiceRenderer } from '@beak/shared-common/ipc/nest';
import { IpcNotificationServiceRenderer } from '@beak/shared-common/ipc/notification';
import { IpcPreferencesServiceRenderer } from '@beak/shared-common/ipc/preferences';
import { IpcProjectServiceRenderer } from '@beak/shared-common/ipc/project';
import { IpcWindowServiceRenderer } from '@beak/shared-common/ipc/window';

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
export const ipcPreferencesService = new IpcPreferencesServiceRenderer(partialIpcRenderer);
export const ipcProjectService = new IpcProjectServiceRenderer(partialIpcRenderer);
export const ipcWindowService = new IpcWindowServiceRenderer(partialIpcRenderer);
