import { RequestNode, RequestNodeFile } from '@beak/common/types/beak-project';
// @ts-ignore
import ksuid from '@cuvva/ksuid';

import { requestSchema } from './schemas';
import { generateSafeNewPath, readJsonAndValidate } from './utils';

const { remote } = window.require('electron');
const path = remote.require('path');
const fs = remote.require('fs-extra');

export async function createRequestNode(directory: string, name?: string, template?: RequestNodeFile) {
	const { fullPath } = await generateSafeNewPath(name || 'Example request', directory, '.json');
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
	};

	await fs.writeJson(fullPath, node, { spaces: '\t' });

	return node.id;
}

export async function readRequestNode(requestFilePath: string) {
	const { file, filePath, name } = await readJsonAndValidate<RequestNodeFile>(requestFilePath, requestSchema);

	const node: RequestNode = {
		type: 'request',
		filePath,
		parent: path.join(filePath, '..'),
		name,
		id: file.id,
		info: {
			verb: file.verb,
			url: file.url,
			query: file.query,
			headers: file.headers,
			body: file.body,
		},
	};

	return node;
}

export async function writeRequestNode(request: RequestNode) {
	const node: RequestNodeFile = {
		id: request.id,
		verb: request.info.verb,
		url: request.info.url,
		query: request.info.query,
		headers: request.info.headers,
		body: request.info.body,
	};

	await fs.writeJson(request.filePath, node, { spaces: '\t' });
}

export async function removeRequestNode(filePath: string) {
	await fs.remove(filePath);
}

export async function renameRequestNode(newName: string, requestNode: RequestNode) {
	const directory = path.dirname(requestNode.filePath);
	const newFilePath = path.join(directory, `${newName}.json`);
	const oldFilePath = requestNode.filePath;

	if (await fs.pathExists(newFilePath))
		throw new Error('Request name already exists');

	await fs.move(oldFilePath, newFilePath);
}

export async function duplicateRequestNode(request: RequestNode) {
	const oldPath = request.filePath;
	const extension = path.extname(oldPath);
	const name = path.basename(oldPath, extension);
	const directory = path.join(oldPath, '..');

	const { fullPath } = await generateSafeNewPath(name, directory, extension);
	const node: RequestNodeFile = {
		id: ksuid.generate('request').toString(),
		verb: request.info.verb,
		url: request.info.url,
		query: request.info.query,
		headers: request.info.headers,
		body: request.info.body,
	};

	await fs.writeJson(fullPath, node, { spaces: '\t' });

	return node.id;
}
