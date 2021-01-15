import { WatchOptions } from 'chokidar';
import { eventChannel } from 'redux-saga';

const { remote } = window.require('electron');
const chokidar = remote.require('chokidar');
const path = remote.require('path');
const fs = remote.require('fs-extra');

export default function createFsEmitter(path: string, options?: WatchOptions) {
	const channel = eventChannel(emitter => {
		const watcher = chokidar
			.watch(path, { ...options, ignoreInitial: true })
			.on('all', (event, path) => emitter({ type: event, path }))
			.on('error', console.error);

		return () => {
			watcher.close();
		};
	});

	return channel;
}

export interface ScanResult {
	path: string;
	isDirectory: boolean;
}

export async function scanDirectoryRecursively(dir: string) {
	const items: ScanResult[] = [];

	for await (const item of scanDirectoryRecursivelyIter(dir))
		items.push(item);

	return items;
}

async function* scanDirectoryRecursivelyIter(dir: string): AsyncGenerator<ScanResult, void, void> {
	const dirents = await fs.readdir(dir, { withFileTypes: true });

	for (const dirent of dirents) {
		const res = path.resolve(dir, dirent.name);
		const extension = path.extname(dirent.name);

		if (dirent.isDirectory()) {
			yield { path: res, isDirectory: true };

			yield* scanDirectoryRecursivelyIter(res);
		} else if (extension === '.json') {
			yield { path: res, isDirectory: false };
		}
	}
}
