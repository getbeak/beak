import path from 'node:path';

import getRuntime from '@beak/apps-host-electron/host';
import { IpcOpenApiServiceMain, type SyncFromSpecReq, type SyncFromSpecRes } from '@beak/common/ipc/openapi';
import { openapiToCollection } from '@beak/state/sources/openapi';
import { ipcMain } from 'electron';

import { getProjectFilePathWindowMapping } from './fs-shared';

const service = new IpcOpenApiServiceMain(ipcMain);

service.registerSyncFromSpec(async (event, payload: SyncFromSpecReq) => {
	const projectFilePath = getProjectFilePathWindowMapping(event);
	if (!projectFilePath) throw new Error('openapi sync: no project bound to this window');

	const projectRoot = path.dirname(projectFilePath);
	const targetFolder = path.join(projectRoot, payload.targetFolder);

	// Sandbox: keep the target inside the project root. A hostile renderer
	// can't escape the tree by passing `../../etc/passwd` style segments.
	const resolved = path.resolve(targetFolder);
	const root = path.resolve(projectRoot);
	if (!resolved.startsWith(`${root}${path.sep}`) && resolved !== root) {
		throw new Error(`openapi sync: targetFolder '${payload.targetFolder}' escapes the project root`);
	}

	const conversion = openapiToCollection(payload.spec as never, {
		specPath: payload.specPath,
		specUrl: payload.specUrl,
	});

	const writeResult = await getRuntime().openapi.syncToFolder(resolved, {
		collection: conversion.collection,
		requests: conversion.requests,
	});

	const response: SyncFromSpecRes = {
		collectionPath: writeResult.collectionPath,
		requestPaths: writeResult.requestPaths,
		overwritten: writeResult.overwritten,
		skipped: writeResult.skipped,
		warnings: conversion.warnings,
	};

	return response;
});
