import type { Store } from 'react-redux';
import type { IpcRendererEvent } from 'electron';
import type { Worker } from 'monaco-editor';

import 'vite/client';
import { ApplicationState } from './store';

declare global {
	interface Window {
		store: Store<ApplicationState>;

		MonacoEnvironment: {
			getWorker: (_: unknown, label: string) => Worker;
		};

		secureBridge: {
			ipc: {
				invoke: <T>(channel: string, payload: unknown) => Promise<T>;
				on: (channel: string, listening: (event: IpcRendererEvent, ...args: any[]) => void) => void;
				off: (event: string, listener: (...args: any[]) => void) => unknown;
			};
		};

		embeddedIndicator?: boolean;
	}
}

declare module 'electron' {
	interface MenuItemConstructorOptions {
		click: () => void;
	}
}

declare module '@getbeak/extension-sdk' {
	interface VariableBase {
		type: string;
		external: boolean;
	}
}
