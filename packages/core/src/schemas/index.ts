import type { ZodType } from 'zod';
import { type Options, zodToJsonSchema } from 'zod-to-json-schema';

export * from './beak-project';
export * from './beak-variable-group';
export * from './preferences';

/**
 * Convert a zod schema to a JSON Schema document. Useful for publishing
 * Beak's on-disk file formats so external tools (VSCode, etc.) can pick
 * them up.
 */
export function toJsonSchema(schema: ZodType, options?: Partial<Options>): ReturnType<typeof zodToJsonSchema> {
	return zodToJsonSchema(schema, options);
}
