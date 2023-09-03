import { IpcEvent } from '@beak/common/ipc/ipc';
import { BrowserWindow, IpcMainInvokeEvent } from 'electron';
import path from 'path';

import { windowIdToProjectIdMapping } from '../window-management';

export function setProjectWindowMapping(windowId: number, projectFilePath: string) {
	windowIdToProjectIdMapping[windowId] = projectFilePath;
}

export function getProjectWindowMapping(event: IpcEvent) {
	const sender = (event as IpcMainInvokeEvent).sender;
	const window = BrowserWindow.fromWebContents(sender)!;

	return windowIdToProjectIdMapping[window.id];
}

export function getProjectFromWindowId(id: number) {
	return windowIdToProjectIdMapping[id];
}

export function removeProjectPathPrefix(event: IpcEvent, filePath: string) {
	const projectFilePath = getProjectWindowMapping(event);
	const projectPath = path.join(projectFilePath, '..');

	return filePath.slice(projectPath.length + 1);
}

export function platformNormalizePath(filePath: string) {
	return filePath.replace(/\\/g, '/');
}
