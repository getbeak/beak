import { z } from 'zod';

/**
 * Content-addressed pointer to a binary asset stored under the project's
 * `_assets/` directory. The sha256 is the canonical identity — two assets
 * with identical bytes share a ref. `size` lets the UI surface size info
 * without reading the file. `contentType` is best-effort metadata.
 *
 * On disk an asset lives at `_assets/<sha256 prefix-2>/<sha256>` (the
 * two-character prefix shards the directory so it doesn't grow unbounded).
 */
export const assetRefSchema = z
	.object({
		sha256: z.string().regex(/^[0-9a-f]{64}$/, 'sha256 must be a 64-char lowercase hex string'),
		size: z.number().int().nonnegative(),
		contentType: z.string().optional(),
	})
	.strict();

export type AssetRef = z.infer<typeof assetRefSchema>;
