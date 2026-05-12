import { z } from 'zod';

/**
 * Variable group file — `variable-groups/<name>.json` on disk.
 *
 * `groups` and `items` are name lookup maps (ksuid → display name).
 * `values` is keyed by `<groupId>&<itemId>` and stores the resolved
 * ValueParts array for that group/item pair.
 */
export const variableGroupSchema = z
	.object({
		groups: z.record(z.string(), z.string()),
		items: z.record(z.string(), z.string()),
		values: z.record(z.string(), z.array(z.unknown())),
	})
	.strict();

export type VariableGroupFile = z.infer<typeof variableGroupSchema>;
