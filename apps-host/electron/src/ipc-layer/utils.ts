import { BrowserWindow, type IpcMainInvokeEvent, type IpcRendererEvent } from 'electron';

type IpcEvent = IpcMainInvokeEvent | IpcRendererEvent;

import path from 'node:path';

import { getProjectFilePathWindowMapping, getProjectIdFromWindowId } from './fs-shared';

export function getProjectFolder(event: IpcEvent) {
	const projectFilePath = getProjectFilePathWindowMapping(event);

	return path.join(projectFilePath, '..');
}

export function getProjectId(event: IpcEvent) {
	const sender = (event as IpcMainInvokeEvent).sender;
	const window = BrowserWindow.fromWebContents(sender)!;

	return getProjectIdFromWindowId(window.id);
}
