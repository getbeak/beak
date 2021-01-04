import { RequestNode, RequestNodeFile } from '@beak/common/types/beak-project';

import { requestSchema } from './schemas';
import readJsonAndValidate from './utils';

const { remote } = window.require('electron');
const path = remote.require('path');
const fs = remote.require('fs-extra');

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
