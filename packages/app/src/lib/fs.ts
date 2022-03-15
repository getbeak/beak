import Squawk from '@beak/common/utils/squawk';
import Ajv, { SchemaObject } from 'ajv';
import path from 'path-browserify';

import { ipcFsService } from './ipc';

const avj = new Ajv();

export async function readJsonAndValidate<T>(filePath: string, schema: SchemaObject, avoidThrow = false) {
	const requestFile = await ipcFsService.readJson<T>(filePath);
	const extension = path.extname(filePath);
	const name = path.basename(filePath, extension);
	const validator = avj.compile(schema);
	const valid = validator(requestFile);

	if (!valid && !avoidThrow) {
		throw new Squawk('schema_invalid', {
			errors: validator.errors,
			filePath,
		});
	}

	return {
		file: requestFile,
		filePath,
		name,
		extension,
		error: valid ? null : new Squawk('schema_invalid', {
			errors: validator.errors,
			filePath,
		}),
	};
}
