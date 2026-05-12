import Squawk from '@beak/common/utils/squawk';
import path from 'path-browserify';
import type { ZodTypeAny } from 'zod';

import { ipcFsService } from './ipc';

/**
 * Reads a JSON file from disk and parses it through a zod schema. Throws a
 * `schema_invalid` Squawk on validation failure (unless `avoidThrow`).
 *
 * The schema's inferred type is independent of `T` — callers can still
 * assert their own type as they did with the legacy ajv-based version.
 * Future cleanup: drop `T` entirely and rely on `z.infer<typeof schema>`.
 */
export async function readJsonAndValidate<T>(filePath: string, schema: ZodTypeAny, avoidThrow = false) {
	const file = await ipcFsService.readJson<T>(filePath);

	const extension = path.extname(filePath);
	const name = path.basename(filePath, extension);

	const result = schema.safeParse(file);

	if (!result.success && !avoidThrow) {
		throw new Squawk('schema_invalid', {
			errors: result.error.issues,
			filePath,
		});
	}

	return {
		file: (result.success ? result.data : file) as T,
		filePath,
		name,
		extension,
		error: result.success
			? null
			: new Squawk('schema_invalid', {
					errors: result.error.issues,
					filePath,
				}),
	};
}
