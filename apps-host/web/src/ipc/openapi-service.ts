import getRuntime from '@beak/apps-host-web/host';
import { IpcOpenApiServiceMain, type SyncFromSpecReq, type SyncFromSpecRes } from '@beak/common/ipc/openapi';
import { openapiToCollection } from '@beak/state/sources/openapi';

import { webIpcMain } from './ipc';
import { getCurrentProjectFolder } from './utils';

const service = new IpcOpenApiServiceMain(webIpcMain);

service.registerSyncFromSpec(async (_event, payload: SyncFromSpecReq) => {
	const projectRoot = getCurrentProjectFolder();
	if (!projectRoot) throw new Error('openapi sync: no project loaded');

	const path = getRuntime().p.node.path;
	const targetFolder = path.join(projectRoot, payload.targetFolder);

	// Sandbox: keep the target inside the project root.
	const normalised = targetFolder.replace(/\/+$/, '');
	const root = projectRoot.replace(/\/+$/, '');
	if (!normalised.startsWith(`${root}/`) && normalised !== root) {
		throw new Error(`openapi sync: targetFolder '${payload.targetFolder}' escapes the project root`);
	}

	const conversion = openapiToCollection(payload.spec as never, {
		seedMode: payload.seedMode,
		specPath: payload.specPath,
		specUrl: payload.specUrl,
		autoSync: payload.autoSync,
		intervalMinutes: payload.intervalMinutes,
		groupByPath: payload.groupByPath,
	});

	const folderName = path.basename(targetFolder) || 'root';

	const writeResult = await getRuntime().openapi.syncToFolder(targetFolder, {
		collection: conversion.collection,
		requests: conversion.requests,
		variableSet: conversion.variableSet,
		folderName,
		projectRoot,
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
