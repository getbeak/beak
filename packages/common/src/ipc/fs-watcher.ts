import * as ksuid from '@cuvva/ksuid';
import { WatchOptions } from 'chokidar';
import { IpcMain, IpcRenderer, WebContents } from 'electron';

import { IpcServiceMain, IpcServiceRenderer, Listener } from './ipc';

export const FsWatcherMessages = {
	StartWatching: 'start_watching',
	WatcherEvent: 'watcher_event',
	WatcherError: 'watcher_error',
	StopWatching: 'stop_watching',
};

export interface StartWatchingReq {
	filePath: string;
	options: WatchOptions;
	sessionIdentifier: string;
	projectFilePath: string;
}

export interface WatcherEvent {
	eventName: 'add' | 'addDir' | 'change' | 'unlink' | 'unlinkDir';
	path: string;
}

export class IpcFsWatcherServiceRenderer extends IpcServiceRenderer {
	private projectFilePath?: string;

	constructor(ipc: IpcRenderer) {
		super('fs_watcher', ipc);
	}

	generateSessionIdentifier() {
		return ksuid.generate('fswatch').toString();
	}

	setProjectFilePath(projectFilePath: string) {
		this.projectFilePath = projectFilePath;
	}

	async startWatching(sessionIdentifier: string, filePath: string, options: WatchOptions) {
		await this.invoke(FsWatcherMessages.StartWatching, {
			filePath,
			options,
			sessionIdentifier,
			projectFilePath: this.projectFilePath,
		});
	}

	async stopWatching(sessionIdentifier: string) {
		await this.invoke(FsWatcherMessages.StopWatching, sessionIdentifier);
	}

	registerWatcherEvent(sessionIdentifier: string, fn: Listener<WatcherEvent>) {
		this.registerListener(createEventCode(sessionIdentifier, FsWatcherMessages.WatcherEvent), fn);
	}

	registerWatcherError(sessionIdentifier: string, fn: Listener<Error>) {
		this.registerListener(createEventCode(sessionIdentifier, FsWatcherMessages.WatcherError), fn);
	}

	unregisterWatcherEvent(sessionIdentifier: string) {
		this.unregisterListener(createEventCode(sessionIdentifier, FsWatcherMessages.WatcherEvent));
	}

	unregisterWatcherError(sessionIdentifier: string) {
		this.unregisterListener(createEventCode(sessionIdentifier, FsWatcherMessages.WatcherError));
	}
}

export class IpcFsWatcherServiceMain extends IpcServiceMain {
	constructor(ipc: IpcMain) {
		super('fs_watcher', ipc);
	}

	registerStartWatching(fn: Listener<StartWatchingReq>) {
		this.registerListener(FsWatcherMessages.StartWatching, fn);
	}

	registerStopWatching(fn: Listener<string>) {
		this.registerListener(FsWatcherMessages.StopWatching, fn);
	}

	sendWatcherEvent(wc: WebContents, sessionIdentifier: string, payload: WatcherEvent) {
		wc.send(this.channel, {
			code: createEventCode(sessionIdentifier, FsWatcherMessages.WatcherEvent),
			payload,
		});
	}

	sendWatcherError(wc: WebContents, sessionIdentifier: string, payload: Error) {
		wc.send(this.channel, {
			code: createEventCode(sessionIdentifier, FsWatcherMessages.WatcherError),
			payload,
		});
	}
}

export function createEventCode(sessionIdentifier: string, eventCode: string) {
	return `${eventCode}:${sessionIdentifier}`;
}
