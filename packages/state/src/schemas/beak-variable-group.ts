import { z } from 'zod';

/**
 * Variable set file — `variable-sets/<name>.json` on disk.
 *
 * `sets` and `items` are name lookup maps (ksuid → display name).
 * `values` is keyed by `<setId>&<itemId>` and stores either:
 *   - the legacy bare `ValueSections` array (treated as text), or
 *   - `{ kind: 'text', value }` for explicit text typing, or
 *   - `{ kind: 'asset', ref, filename? }` for binary environment values.
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
		values: z.record(
			z.string(),
			z.union([
				z.array(z.unknown()),
				z
					.object({
						kind: z.literal('text'),
						value: z.array(z.unknown()),
					})
					.strict(),
				z
					.object({
						kind: z.literal('asset'),
						ref: z
							.object({
								sha256: z.string().regex(/^[0-9a-f]{64}$/),
								size: z.number().int().nonnegative(),
								contentType: z.string().optional(),
							})
							.strict(),
						filename: z.string().optional(),
					})
					.strict(),
			]),
		),
	})
	.strict();

export type VariableGroupFile = z.infer<typeof variableGroupSchema>;
