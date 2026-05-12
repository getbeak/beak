import ksuid from '@beak/ksuid';
import {
	diffFromDefaults,
	mergeCollectionDefaults,
	type RequestFile,
	requestFileOverrideSchema,
} from '@beak/state/schemas';
import type { RequestNode, RequestNodeFile } from '@getbeak/types/nodes';
import path from 'path-browserify';

import { readJsonAndValidate } from '../fs';
import { ipcFsService } from '../ipc';
import { loadCollectionForRequest } from './collection';
import { requestSchema } from './schemas';
import { generateSafeNewPath } from './utils';

function hasNonEmptyDefaults(defaults: unknown): boolean {
	return Boolean(defaults && typeof defaults === 'object' && Object.keys(defaults).length > 0);
}

export async function createRequestNode(directory: string, name?: string, template?: RequestNodeFile) {
	const { fullPath } = await generateSafeNewPath(name || 'New request', directory, '.json');
	const node = template || {
		id: ksuid.generate('request').toString(),
		verb: 'get',
		headers: {},
		url: ['https://httpbin.org/anything'],
		query: {},
		body: {
			type: 'text',
			payload: '',
		},
		options: {
			followRedirects: false,
		},
	};

	await ipcFsService.writeJson(fullPath, node, { spaces: '\t' });

	return node.id;
}

export async function readRequestNode(requestFilePath: string): Promise<RequestNode> {
	const collection = await loadCollectionForRequest(requestFilePath);

	if (hasNonEmptyDefaults(collection?.defaults)) {
		// Sparse override path: validate against the override schema, then
		// merge the collection's defaults into the override to produce the
		// concrete request the renderer expects.
		const { file, filePath, name, error } = await readJsonAndValidate<{ id?: string }>(
			requestFilePath,
			requestFileOverrideSchema,
			true,
		);

		if (error) {
			return {
				type: 'request',
				filePath,
				parent: path.join(filePath, '..'),
				name,
				id: (file?.id as string) || ksuid.generate('failedrequest').toString(),
				mode: 'failed',
				error,
			};
		}

		const merged = mergeCollectionDefaults(collection?.defaults, file as never) as RequestNodeFile;
		return {
			type: 'request',
			filePath,
			parent: path.join(filePath, '..'),
			name,
			id: merged.id,
			mode: 'valid',
			info: { ...merged },
		};
	}

	// Legacy / empty-defaults path: validate as a full request file.
	const { file, filePath, name, error } = await readJsonAndValidate<RequestNodeFile>(
		requestFilePath,
		requestSchema,
		true,
	);

	if (error) {
		return {
			type: 'request',
			filePath,
			parent: path.join(filePath, '..'),
			name,
			id: file.id || ksuid.generate('failedrequest').toString(),
			mode: 'failed',
			error,
		};
	}

	return {
		type: 'request',
		filePath,
		parent: path.join(filePath, '..'),
		name,
		id: file.id,
		mode: 'valid',
		info: { ...file },
	};
}

export async function writeRequestNode(request: RequestNode) {
	// Don't write invalid files!
	if (request.mode === 'failed') return;

	const node: RequestNodeFile = {
		id: request.id,
		...request.info,
	};

	const collection = await loadCollectionForRequest(request.filePath);

	if (hasNonEmptyDefaults(collection?.defaults)) {
		// Sparse override path: compute the diff against the collection's
		// defaults and persist only the fields that differ. This keeps the
		// diff tree quiet for routine API usage.
		const sparse = diffFromDefaults(collection?.defaults, node as unknown as RequestFile);
		await ipcFsService.writeJson(request.filePath, sparse, { spaces: '\t' });
		return;
	}

	// Legacy / empty-defaults path: write the full request file.
	await ipcFsService.writeJson(request.filePath, node, { spaces: '\t' });
}

export async function removeRequestNode(filePath: string) {
	await ipcFsService.remove(filePath);
}

export async function renameRequestNode(newName: string, requestNode: RequestNode) {
	const directory = path.dirname(requestNode.filePath);
	const newFilePath = path.join(directory, `${newName}.json`);
	const oldFilePath = requestNode.filePath;

	if (await ipcFsService.pathExists(newFilePath)) throw new Error('Request already exists');

	await ipcFsService.move(oldFilePath, newFilePath);
}

export async function duplicateRequestNode(request: RequestNode): Promise<string | null> {
	const oldPath = request.filePath;
	const extension = path.extname(oldPath);
	const name = path.basename(oldPath, extension);
	const directory = path.join(oldPath, '..');

	// Don't allow duplicating invalid nodes!
	if (request.mode === 'failed') return null;

	const { fullPath } = await generateSafeNewPath(name, directory, extension);
	const node: RequestNodeFile = {
		...request.info,
		id: ksuid.generate('request').toString(),
	};

	await ipcFsService.writeJson(fullPath, node, { spaces: '\t' });

	return node.id;
}
