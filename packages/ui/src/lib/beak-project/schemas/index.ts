// Schemas live in @beak/core/schemas now (zod-based, with z.infer types).
// This module re-exports them under the legacy names for back-compat.
export {
	projectFileSchema as projectSchema,
	requestFileSchema as requestSchema,
} from '@beak/core/schemas';
