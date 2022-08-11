import { Store } from 'react-redux';
import type { Context } from '@getbeak/types/values';
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
	}
}

declare module 'electron' {
	interface MenuItemConstructorOptions {
		click: () => void;
	}
}

declare module '@getbeak/types-realtime-value' {
	interface GenericDictionary {
		[k: string]: any;
	}

	interface RealtimeValueBase {
		type: string;
		external: boolean;
	}

	interface RealtimeValue<TPayload extends GenericDictionary> {

		/**
		 * Gets the string value of the value, given the payload body
		 * @param {Context} ctx The project context.
		 * @param {TPayload} payload This instance of the value's payload data.
		 * @param {number} recursiveDepth 
		 */
		getValue: (ctx: Context, payload: TPayload, recursiveDepth: number) => Promise<string>;
	}

	interface EditableRealtimeValue<TPayload extends GenericDictionary> {

		/**
		 * Gets the string value of the value, given the payload body
		 * @param {Context} ctx The project context.
		 * @param {TPayload} payload This instance of the value's payload data.
		 */
		getValue: (ctx: Context, payload: TPayload, recursiveDepth: number) => Promise<string>;
	}
}
