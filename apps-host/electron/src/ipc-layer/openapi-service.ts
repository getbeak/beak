import path from 'node:path';

import getRuntime from '@beak/apps-host-electron/host';
import {
	type ExportFromFolderReq,
	type ExportFromFolderRes,
	IpcOpenApiServiceMain,
	type SyncFromSpecReq,
	type SyncFromSpecRes,
} from '@beak/common/ipc/openapi';
import { collectionToOpenapi, openapiToCollection } from '@beak/state/sources/openapi';
import type { VariableSet } from '@getbeak/types/variable-sets';
import { ipcMain } from 'electron';

import { getProjectFolder } from './utils';

const service = new IpcOpenApiServiceMain(ipcMain);

service.registerSyncFromSpec(async (event, payload: SyncFromSpecReq) => {
	const projectRoot = getProjectFolder(event);
	if (!projectRoot) throw new Error('openapi sync: no project bound to this window');

	// Sandbox: same safety check the FS handlers use — a hostile renderer
	// can't escape the tree by passing `../../etc/passwd` style segments.
	// Returns the resolved absolute path.
	const resolved = await getRuntime().fs.ensureWithinProject(projectRoot, payload.targetFolder);

	const conversion = openapiToCollection(payload.spec as never, {
		seedMode: payload.seedMode,
		specPath: payload.specPath,
		specUrl: payload.specUrl,
		autoSync: payload.autoSync,
		intervalMinutes: payload.intervalMinutes,
		groupByPath: payload.groupByPath,
	});

	// Last path segment becomes the folder name used to namespace variable
	// set items (e.g. `petstore.baseUrl`). Project root → empty folder, which
	// the merger handles by namespacing as `.baseUrl` — ugly but harmless.
	const folderName = path.basename(resolved) || 'root';

	const writeResult = await getRuntime().openapi.syncToFolder(resolved, {
		collection: conversion.collection,
		requests: conversion.requests,
		variableSet: conversion.variableSet,
		folderName,
		projectRoot: path.resolve(projectRoot),
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

service.registerExportFromFolder(async (event, payload: ExportFromFolderReq) => {
	const projectRoot = getProjectFolder(event);
	if (!projectRoot) throw new Error('openapi export: no project bound to this window');

	const resolved = await getRuntime().fs.ensureWithinProject(projectRoot, payload.folder);
	const read = await getRuntime().openapi.readFromFolder(resolved);

	// Variable set lookup is best-effort — when the project doesn't carry one
	// with the requested name, the exporter falls back to flattening the
	// baseUrl directly. No throw on missing file.
	let variableSet: VariableSet | null = null;
	if (payload.variableSetName) {
		try {
			const setPath = path.join(projectRoot, 'variable-sets', `${payload.variableSetName}.json`);
			const raw = await getRuntime().p.node.fs.promises.readFile(setPath, 'utf8');
			variableSet = JSON.parse(raw as unknown as string) as VariableSet;
		} catch {
			variableSet = null;
		}
	}

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
