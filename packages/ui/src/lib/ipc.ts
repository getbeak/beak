import { IpcAppServiceRenderer } from '@beak/common/ipc/app';
import { IpcAssetsServiceRenderer } from '@beak/common/ipc/assets';
import { IpcBeakHubServiceRenderer } from '@beak/common/ipc/beak-hub';
import { IpcContextMenuServiceRenderer } from '@beak/common/ipc/context-menu';
import { IpcDialogServiceRenderer } from '@beak/common/ipc/dialog';
import { IpcEncryptionServiceRenderer } from '@beak/common/ipc/encryption';
import { IpcExplorerServiceRenderer } from '@beak/common/ipc/explorer';
import { IpcExtensionsServiceRenderer } from '@beak/common/ipc/extensions';
import { IpcFlightServiceRenderer } from '@beak/common/ipc/flight';
import { IpcFsServiceRenderer } from '@beak/common/ipc/fs';
import { IpcFsWatcherServiceRenderer } from '@beak/common/ipc/fs-watcher';
import { IpcGitServiceRenderer } from '@beak/common/ipc/git';
import { IpcGrpcServiceRenderer } from '@beak/common/ipc/grpc';
import { IpcHttpServiceRenderer } from '@beak/common/ipc/http';
import { IpcNotificationServiceRenderer } from '@beak/common/ipc/notification';
import { IpcOpenApiServiceRenderer } from '@beak/common/ipc/openapi';
import { IpcPreferencesServiceRenderer } from '@beak/common/ipc/preferences';
import { IpcProjectServiceRenderer } from '@beak/common/ipc/project';
import type { PartialIpcRenderer } from '@beak/common/ipc/renderer';
import { IpcSocketServiceRenderer } from '@beak/common/ipc/socket';
import { IpcValuesServiceRenderer } from '@beak/common/ipc/values';
import { IpcWindowServiceRenderer } from '@beak/common/ipc/window';

const partialIpcRenderer: PartialIpcRenderer = {
	on: window.secureBridge.ipc.on,
	invoke: window.secureBridge.ipc.invoke,
};

export const ipcAppService = new IpcAppServiceRenderer(partialIpcRenderer);
export const ipcAssetsService = new IpcAssetsServiceRenderer(partialIpcRenderer);
export const ipcBeakHubService = new IpcBeakHubServiceRenderer(partialIpcRenderer);
export const ipcContextMenuService = new IpcContextMenuServiceRenderer(partialIpcRenderer);
export const ipcDialogService = new IpcDialogServiceRenderer(partialIpcRenderer);
export const ipcEncryptionService = new IpcEncryptionServiceRenderer(partialIpcRenderer);
export const ipcExplorerService = new IpcExplorerServiceRenderer(partialIpcRenderer);
export const ipcExtensionsService = new IpcExtensionsServiceRenderer(partialIpcRenderer);
export const ipcFlightService = new IpcFlightServiceRenderer(partialIpcRenderer);
export const ipcFsService = new IpcFsServiceRenderer(partialIpcRenderer);
export const ipcFsWatcherService = new IpcFsWatcherServiceRenderer(partialIpcRenderer);
export const ipcGitService = new IpcGitServiceRenderer(partialIpcRenderer);
export const ipcGrpcService = new IpcGrpcServiceRenderer(partialIpcRenderer);
export const ipcHttpService = new IpcHttpServiceRenderer(partialIpcRenderer);
export const ipcNotificationService = new IpcNotificationServiceRenderer(partialIpcRenderer);
export const ipcOpenApiService = new IpcOpenApiServiceRenderer(partialIpcRenderer);
export const ipcPreferencesService = new IpcPreferencesServiceRenderer(partialIpcRenderer);
export const ipcProjectService = new IpcProjectServiceRenderer(partialIpcRenderer);
export const ipcSocketService = new IpcSocketServiceRenderer(partialIpcRenderer);
export const ipcValuesService = new IpcValuesServiceRenderer(partialIpcRenderer);
export const ipcWindowService = new IpcWindowServiceRenderer(partialIpcRenderer);
