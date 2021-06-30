import Squawk from '@beak/common/utils/squawk';
import Ajv, { SchemaObject } from 'ajv';

const remote = window.require('@electron/remote');
const fs = remote.require('fs-extra');
const path = remote.require('path');

const avj = new Ajv();

export async function readJsonAndValidate<T>(filePath: string, schema: SchemaObject) {
	const requestFile = await fs.readJson(filePath) as T;
	const extension = path.extname(filePath);
	const name = path.basename(filePath, extension);

	const validator = avj.compile(schema);

	if (!validator(requestFile)) {
		throw new Squawk('schema_invalid', {
			errors: validator.errors,
			filePath,
		});
	}

	return { file: requestFile, filePath, name, extension };
}
