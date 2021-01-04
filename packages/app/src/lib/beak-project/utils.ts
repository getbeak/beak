import { validate } from 'jsonschema';

const { remote } = window.require('electron');
const fs = remote.require('fs-extra');
const path = remote.require('path');

export default async function readJsonAndValidate<T>(filePath: string, schema: any) {
	const requestFile = await fs.readJson(filePath) as T;
	const extension = path.extname(filePath);
	const name = path.basename(filePath, extension);

	validate(requestFile, schema, { throwError: true });

	return { file: requestFile, filePath, name, extension };
}
