import { RequestNode, RequestNodeFile } from '@beak/shared-common/types/beak-project';
import ksuid from '@cuvva/ksuid';
import path from 'path-browserify';

import { readJsonAndValidate } from '../fs';
import { ipcFsService } from '../ipc';
import { requestSchema } from './schemas';
import { generateSafeNewPath } from './utils';

export async function createRequestNode(directory: string, name?: string, template?: RequestNodeFile) {
	const { fullPath } = await generateSafeNewPath(name || 'New request', directory, '.json');
	const node = template || {
		id: ksuid.generate('request').toString(),
		verb: 'get',
		headers: {},
		url: ['https://httpbin.org/anything'],
		query: { },
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
	const {
		file,
		filePath,
		name,
		error,
	} = await readJsonAndValidate<RequestNodeFile>(requestFilePath, requestSchema, true);

	if (error) {
		return {
			type: 'request',
			filePath,
			parent: path.join(filePath, '..'),
			name,
			id: file.id,
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
	if (request.mode === 'failed')
		return;

	const node: RequestNodeFile = {
		id: request.id,
		...request.info,
	};

	await ipcFsService.writeJson(request.filePath, node, { spaces: '\t' });
}

export async function removeRequestNode(filePath: string) {
	await ipcFsService.remove(filePath);
}

export async function renameRequestNode(newName: string, requestNode: RequestNode) {
	const directory = path.dirname(requestNode.filePath);
	const newFilePath = path.join(directory, `${newName}.json`);
	const oldFilePath = requestNode.filePath;

	if (await ipcFsService.pathExists(newFilePath))
		throw new Error('Request already exists');

	await ipcFsService.move(oldFilePath, newFilePath);
}

export async function duplicateRequestNode(request: RequestNode): Promise<string | null> {
	const oldPath = request.filePath;
	const extension = path.extname(oldPath);
	const name = path.basename(oldPath, extension);
	const directory = path.join(oldPath, '..');

	// Don't allow duplicating invalid nodes!
	if (request.mode === 'failed')
		return null;

	const { fullPath } = await generateSafeNewPath(name, directory, extension);
	const node: RequestNodeFile = {
		...request.info,
		id: ksuid.generate('request').toString(),
	};

	await ipcFsService.writeJson(fullPath, node, { spaces: '\t' });

	return node.id;
}
