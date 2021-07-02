import { IpcRendererEvent } from 'electron';
import { Store } from 'react-redux';

import { ApplicationState } from './store';

declare global {
	interface Window {
		store: Store<ApplicationState>;

		ipc: {
			invoke: <T>(channel: string, payload: unknown) => Promise<T>;
			on: (channel: string, listening: (event: IpcRendererEvent, ...args: any[]) => void) => unknown;
			off: (event: string, listener: (...args: any[]) => void) => unknown;
			// on: (channel: string, listening: (event: IpcRendererEvent, ...args: any[]) => void) => void;
		};
	}
}

declare module 'react-redux' {
	interface DefaultRootState extends ApplicationState {}
}
