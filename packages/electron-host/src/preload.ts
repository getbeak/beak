/* eslint-disable no-process-env */
import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';

import '@sentry/electron/preload';

type Listener = (event: IpcRendererEvent, ...args: unknown[]) => void;

// Secure Bridge
contextBridge.exposeInMainWorld('secureBridge', {
	ipc: {
		invoke: async (channel: string, payload: unknown) => ipcRenderer.invoke(channel, payload),
		on: (channel: string, listener: Listener) => ipcRenderer.on(channel, listener),
		off: (channel: string, listener: Listener) => ipcRenderer.off(channel, listener),
		removeListener: (channel: string, listener: Listener) => ipcRenderer.removeListener(channel, listener),
	},
});
