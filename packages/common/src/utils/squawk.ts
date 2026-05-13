// Compatibility re-export. The canonical implementation lives in @beak/squawk;
// this module exists so the many in-tree imports from '@beak/common/utils/squawk'
// keep working without a sweeping rename.
export { default, BeakError, NotFoundError, ValidationError } from '@beak/squawk';
export type { SerializedReason, SerializedSquawk } from '@beak/squawk';
