import { ValidationError } from '@beak/common/utils/squawk';
import path from 'path-browserify';
import type { ZodTypeAny } from 'zod';

import { ipcFsService } from './ipc';

/**
 * Reads a JSON file from disk and parses it through a zod schema. Throws a
 * `ValidationError` (kind: `schema_invalid`) on failure, with the full
 * Zod issue list flattened into `meta.fieldErrors` (`{ path: message }`) so
 * downstream UI can render readable diagnostics.
 *
 * When `avoidThrow=true`, returns `{ error }` instead of throwing.
 */
export async function readJsonAndValidate<T>(filePath: string, schema: ZodTypeAny, avoidThrow = false) {
	const file = await ipcFsService.readJson<T>(filePath);

	const extension = path.extname(filePath);
	const name = path.basename(filePath, extension);

	const result = schema.safeParse(file);

	if (!result.success) {
		const error = ValidationError.fromZodError(result.error, { filePath });
		if (!avoidThrow) throw error;

		return {
			file: file as T,
			filePath,
			name,
			extension,
			error,
		};
	}

	return {
		file: result.data as T,
		filePath,
		name,
		extension,
		error: null as ValidationError | null,
	};
}
