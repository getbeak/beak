import ksuid from '@beak/ksuid';
import type { ChokidarOptions } from 'chokidar';
import type { WebContents } from 'electron';
import type { PartialIpcMain } from './main';
import { IpcServiceMain } from './main';
import type { PartialIpcRenderer } from './renderer';
import { IpcServiceRenderer } from './renderer';
import type { IpcListener } from './types';

export const FsWatcherMessages = {
	StartWatching: 'start_watching',
	WatcherEvent: 'watcher_event',
	WatcherError: 'watcher_error',
	StopWatching: 'stop_watching',
};

export interface StartWatchingReq {
	filePath: string;
	options: ChokidarOptions;
	sessionIdentifier: string;
}

export interface WatcherEvent {
	eventName: 'add' | 'addDir' | 'change' | 'unlink' | 'unlinkDir';
	path: string;
}

export class IpcFsWatcherServiceRenderer extends IpcServiceRenderer<'fs_watcher'> {
	constructor(ipc: PartialIpcRenderer) {
		super('fs_watcher', ipc);
	}

	generateSessionIdentifier() {
		return ksuid.generate('fswatch').toString();
	}

	async startWatching(sessionIdentifier: string, filePath: string, options: ChokidarOptions) {
		await this.invoke(FsWatcherMessages.StartWatching, {
			filePath,
			options,
			sessionIdentifier,
		});
	}

	async stopWatching(sessionIdentifier: string) {
		await this.invoke(FsWatcherMessages.StopWatching, sessionIdentifier);
	}

	registerWatcherEvent(sessionIdentifier: string, fn: IpcListener<WatcherEvent>) {
		this.registerListener(createEventCode(sessionIdentifier, FsWatcherMessages.WatcherEvent), fn);
	}

	registerWatcherError(sessionIdentifier: string, fn: IpcListener<Error>) {
		this.registerListener(createEventCode(sessionIdentifier, FsWatcherMessages.WatcherError), fn);
	}

	unregisterWatcherEvent(sessionIdentifier: string) {
		this.unregisterListener(createEventCode(sessionIdentifier, FsWatcherMessages.WatcherEvent));
	}

	unregisterWatcherError(sessionIdentifier: string) {
		this.unregisterListener(createEventCode(sessionIdentifier, FsWatcherMessages.WatcherError));
	}
}

export class IpcFsWatcherServiceMain extends IpcServiceMain<'fs_watcher'> {
	constructor(ipc: PartialIpcMain) {
		super('fs_watcher', ipc);
	}

	registerStartWatching(fn: IpcListener<StartWatchingReq>) {
		this.registerRequestHandler(FsWatcherMessages.StartWatching, fn);
	}

	registerStopWatching(fn: IpcListener<string>) {
		this.registerRequestHandler(FsWatcherMessages.StopWatching, fn);
	}

	sendWatcherEvent(wc: WebContents, sessionIdentifier: string, payload: WatcherEvent) {
		this.sendMessage(wc, createEventCode(sessionIdentifier, FsWatcherMessages.WatcherEvent), payload);
	}

	sendWatcherError(wc: WebContents, sessionIdentifier: string, payload: Error) {
		this.sendMessage(wc, createEventCode(sessionIdentifier, FsWatcherMessages.WatcherError), payload);
	}
}

export function createEventCode(sessionIdentifier: string, eventCode: string) {
	return `${eventCode}:${sessionIdentifier}`;
}
