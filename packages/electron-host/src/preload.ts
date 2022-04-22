/* eslint-disable no-process-env */

import { init } from '@sentry/electron/dist/renderer';
import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';

// Sentry
init({
	dsn: 'https://5118444e09d74b03a320d0e604aa68ff@o988021.ingest.sentry.io/5945114',
	appName: 'Renderer',
	environment: process.env.ENVIRONMENT,
	release: process.env.RELEASE_IDENTIFIER,
});

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
