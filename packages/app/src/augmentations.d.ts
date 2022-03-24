import { Store } from 'react-redux';
import type { IpcRendererEvent } from 'electron';

import { ApplicationState } from './store';

declare global {
	interface Window {
		store: Store<ApplicationState>;

		secureBridge: {
			ipc: {
				invoke: <T>(channel: string, payload: unknown) => Promise<T>;
				on: (channel: string, listening: (event: IpcRendererEvent, ...args: any[]) => void) => void;
				off: (event: string, listener: (...args: any[]) => void) => unknown;
			};
		};
	}
}

declare module 'electron' {
	interface MenuItemConstructorOptions {
		click: () => void;
	}
}

declare module 'react-redux' {
	interface DefaultRootState extends ApplicationState {}
}
