import { IpcEvent } from '@beak/common/ipc/ipc';
import { BrowserWindow, IpcMainInvokeEvent } from 'electron';
import path from 'path';

const windowProjectMapping: Record<number, string> = {};

export function setProjectWindowMapping(windowId: number, projectFilePath: string) {
	windowProjectMapping[windowId] = projectFilePath;
}

export function getProjectWindowMapping(event: IpcEvent) {
	const sender = (event as IpcMainInvokeEvent).sender;
	const window = BrowserWindow.fromWebContents(sender)!;

	return windowProjectMapping[window.id];
}

export function removeProjectPathPrefix(event: IpcEvent, filePath: string) {
	const projectFilePath = getProjectWindowMapping(event);
	const projectPath = path.join(projectFilePath, '..');

	return filePath.slice(projectPath.length + 1);
}
