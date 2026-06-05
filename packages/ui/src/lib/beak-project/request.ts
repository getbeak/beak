import ksuid from '@beak/ksuid';
import { provenance } from '@beak/state';
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
			decompressResponse: true,
			timeoutMs: 0,
			maxRedirects: 5,
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
			info: ensureRuntimeShape(merged),
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
		info: ensureRuntimeShape(file),
	};
}

/**
 * Backfill the runtime invariants the renderer assumes about a valid request
 * node. `body` is the load-bearing one — `RequestPane` and the flight machinery
 * read `info.body.type` unconditionally, but the on-disk schema and the
 * collection-defaults merge both allow `body` to be absent (a sparse override
 * with no body alongside a collection whose defaults don't declare one yields
 * `merged.body === undefined`). Default to an empty text body so the renderer
 * stays crash-free. `query` / `headers` / `options` get the same treatment
 * since they're addressed the same way downstream.
 */
function ensureRuntimeShape(file: RequestNodeFile): RequestNodeFile {
	return {
		...file,
		body: file.body ?? { type: 'text', payload: '' },
		query: file.query ?? {},
		headers: file.headers ?? {},
		options: file.options ?? {
			followRedirects: false,
			decompressResponse: true,
			timeoutMs: 0,
			maxRedirects: 5,
		},
		// `pathParameters` stays absent rather than backfilled to `{}` so the
		// renderer can distinguish "linked OpenAPI request with declared
		// params" from "hand-authored request" — the section only mounts
		// when this map is present.
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

/**
 * Persist an unlinked copy of a linked request alongside the original. The
 * original file is left intact so the next spec re-sync can repopulate it;
 * the new file carries the user's in-memory edits and is marked
 * `_provenance.linked: false` so future syncs leave it alone.
 *
 * Returns the new request id and absolute file path. Caller wires the tab
 * switch + dirty-flag clear in the orchestrator (the helper is
 * deliberately I/O-only so it's easy to test).
 */
export async function unlinkAndPersistAs(request: RequestNode): Promise<{ id: string; filePath: string } | null> {
	if (request.mode === 'failed') return null;

	const oldPath = request.filePath;
	const extension = path.extname(oldPath);
	const baseName = path.basename(oldPath, extension);
	const directory = path.join(oldPath, '..');

	const { fullPath } = await generateSafeNewPath(`${baseName}-edited`, directory, extension);

	const newId = ksuid.generate('request').toString();
	const unlinkedInfo = provenance.unlinkRequest(request.info);
	const node: RequestNodeFile = {
		...unlinkedInfo,
		id: newId,
	};

	await ipcFsService.writeJson(fullPath, node, { spaces: '\t' });

	return { id: newId, filePath: fullPath };
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
