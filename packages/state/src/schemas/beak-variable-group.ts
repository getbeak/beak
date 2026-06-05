import { z } from 'zod';

/**
 * Variable set file — `variable-sets/<name>.json` on disk.
 *
 * `sets` and `items` are name lookup maps (ksuid → display name).
 * `values` is keyed by `<setId>&<itemId>` and stores the resolved
 * ValueParts array for that set/item pair.
 *
 * Historical note: this file format was previously called "variable
 * group" (with `groups: …` instead of `sets: …`). The May 2026 rename
 * touched the runtime types, write path, and directory name — but the
 * read schema was missed, so freshly-written `sets: …` files failed
 * validation on the next reload and silently disappeared. Aligned now.
 */
export const variableGroupSchema = z
	.object({
		sets: z.record(z.string(), z.string()),
		items: z.record(z.string(), z.string()),
		values: z.record(z.string(), z.array(z.unknown())),
	})
	.strict();

export type VariableGroupFile = z.infer<typeof variableGroupSchema>;
