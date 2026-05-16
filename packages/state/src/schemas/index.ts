import { type ZodType, z } from 'zod';

export * from './beak-project';
export * from './beak-variable-group';
export * from './beak-workflow';
export * from './collection-merge';
export * from './cookies';
export * from './flight-history';
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
