import { BrowserWindow, type IpcMainInvokeEvent, type IpcRendererEvent } from 'electron';

type IpcEvent = IpcMainInvokeEvent | IpcRendererEvent;

import path from 'node:path';

import { windowIdToProjectFilePathMapping, windowIdToProjectIdMapping } from '../window-management';

export function setProjectIdWindowMapping(windowId: number, projectId: string) {
	windowIdToProjectIdMapping[windowId] = projectId;
}

export function setProjectFilePathWindowMapping(windowId: number, projectFilePath: string) {
	windowIdToProjectFilePathMapping[windowId] = projectFilePath;
}

export function getProjectFilePathWindowMapping(event: IpcEvent) {
	const sender = (event as IpcMainInvokeEvent).sender;
	const window = BrowserWindow.fromWebContents(sender)!;

	return windowIdToProjectFilePathMapping[window.id];
}

export function getProjectFilePathFromWindowId(id: number) {
	return windowIdToProjectFilePathMapping[id];
}

export function getProjectIdFromWindowId(id: number) {
	return windowIdToProjectIdMapping[id];
}

export function removeProjectPathPrefix(event: IpcEvent, filePath: string) {
	const projectFilePath = getProjectFilePathWindowMapping(event);
	const projectPath = path.join(projectFilePath, '..');

	return filePath.slice(projectPath.length + 1);
}

export function platformNormalizePath(filePath: string) {
	return filePath.replace(/\\/g, '/');
}
