import getRuntime from '@beak/apps-host-web/host';
import {
	type ExportFromFolderReq,
	type ExportFromFolderRes,
	IpcOpenApiServiceMain,
	type SyncFromSpecReq,
	type SyncFromSpecRes,
} from '@beak/common/ipc/openapi';
import { collectionToOpenapi, openapiToCollection } from '@beak/state/sources/openapi';
import type { VariableSet } from '@getbeak/types/variable-sets';

import { webIpcMain } from './ipc';
import { getCurrentProjectFolder } from './utils';

const service = new IpcOpenApiServiceMain(webIpcMain);

service.registerSyncFromSpec(async (_event, payload: SyncFromSpecReq) => {
	const projectRoot = getCurrentProjectFolder();
	if (!projectRoot) throw new Error('openapi sync: no project loaded');

	// Same safety check the FS handlers use — both hosts share one
	// implementation in @beak/runtime-shared so the prefix-boundary rule
	// can't drift between them again.
	const resolved = await getRuntime().fs.ensureWithinProject(projectRoot, payload.targetFolder);

	const conversion = openapiToCollection(payload.spec as never, {
		seedMode: payload.seedMode,
		specPath: payload.specPath,
		specUrl: payload.specUrl,
		autoSync: payload.autoSync,
		intervalMinutes: payload.intervalMinutes,
		groupByPath: payload.groupByPath,
	});

	const path = getRuntime().p.node.path;
	const folderName = path.basename(resolved) || 'root';

	const writeResult = await getRuntime().openapi.syncToFolder(resolved, {
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

service.registerExportFromFolder(async (_event, payload: ExportFromFolderReq) => {
	const projectRoot = getCurrentProjectFolder();
	if (!projectRoot) throw new Error('openapi export: no project loaded');

	const resolved = await getRuntime().fs.ensureWithinProject(projectRoot, payload.folder);
	const read = await getRuntime().openapi.readFromFolder(resolved);

	let variableSet: VariableSet | null = null;
	if (payload.variableSetName) {
		try {
			const path = getRuntime().p.node.path;
			const setPath = path.join(projectRoot, 'variable-sets', `${payload.variableSetName}.json`);
			const raw = await getRuntime().p.node.fs.promises.readFile(setPath, 'utf8');
			variableSet = JSON.parse(raw as unknown as string) as VariableSet;
		} catch {
			variableSet = null;
		}
	}

	const path = getRuntime().p.node.path;
	const folderTitle = path.basename(resolved) || 'Beak Export';
	const result = collectionToOpenapi(read.collection, read.requests, {
		title: payload.title ?? folderTitle,
		version: payload.version ?? '1.0.0',
		...(payload.description ? { description: payload.description } : {}),
		variableSet,
	});

	const response: ExportFromFolderRes = {
		document: result.document,
		warnings: result.warnings,
		skipped: read.skipped,
	};
	return response;
});
