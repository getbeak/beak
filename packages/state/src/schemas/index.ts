import { z, type ZodType } from 'zod';

export * from './beak-project';
export * from './beak-variable-group';
export * from './collection-merge';
export * from './preferences';
export * from './request-schema';
export * from './request-values';

/**
 * Convert a zod schema to a JSON Schema document. Useful for publishing
 * Beak's on-disk file formats so external tools (VSCode, etc.) can pick
 * them up.
 */
export function toJsonSchema(schema: ZodType, options?: Parameters<typeof z.toJSONSchema>[1]) {
	return z.toJSONSchema(schema, options);
}
