// Schema lives in @beak/state/schemas now (zod-based, with z.infer types).
// This module re-exports it under the legacy name for back-compat.
export { variableGroupSchema as variableSetSchema } from '@beak/state/schemas';
