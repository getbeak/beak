import { z } from 'zod';

/**
 * On-disk schemas for the per-project cookie jar. Cookies sit at rest
 * inside a sealed envelope (AES-256-CTR via the project's keychain
 * entry, same vault that stores credentials and `secure:`/`private:`
 * variable values) — the renderer encrypts the JSON serialization of
 * `cookieJarFileSchema` and writes the resulting `sealedCookieFileSchema`
 * blob to `.beak/cookies.sealed`.
 *
 * Plaintext shape mirrors RFC 6265 §5.3 cookie storage: name, value,
 * canonicalised domain + path, host-only flag, security attributes,
 * SameSite, expiry, and bookkeeping timestamps for LRU eviction.
 */

const sameSiteSchema = z.enum(['Strict', 'Lax', 'None']);

export const persistedCookieSchema = z
	.object({
		name: z.string(),
		value: z.string(),
		domain: z.string(),
		path: z.string(),
		hostOnly: z.boolean(),
		secure: z.boolean(),
		httpOnly: z.boolean(),
		sameSite: sameSiteSchema.optional(),
		/** Epoch ms; absent for session cookies. */
		expires: z.number().int().optional(),
		creation: z.number().int(),
		lastAccessed: z.number().int(),
	})
	.passthrough();

export type PersistedCookie = z.infer<typeof persistedCookieSchema>;

/** Cookies grouped by variable-set item (the "environment column"). */
export const persistedCookieJarSchema = z.record(z.string(), z.array(persistedCookieSchema));

export type PersistedCookieJar = z.infer<typeof persistedCookieJarSchema>;

/** Plaintext file shape — what we serialize before sealing. */
export const cookieJarFileSchema = z
	.object({
		version: z.literal(1),
		/** Map of variable-set name → jar. */
		jars: z.record(z.string(), persistedCookieJarSchema),
	})
	.strict();

export type CookieJarFile = z.infer<typeof cookieJarFileSchema>;

export function emptyCookieJarFile(): CookieJarFile {
	return { version: 1, jars: {} };
}

/**
 * Wire format actually written to disk — a versioned envelope around the
 * AES-CTR ciphertext + IV produced by `ipcEncryptionService.encryptObject`.
 * Keeps the file self-describing so we never need to remember the IV
 * elsewhere in state.
 */
export const sealedCookieFileSchema = z
	.object({
		v: z.literal(1),
		iv: z.string(),
		ciphertext: z.string(),
	})
	.strict();

export type SealedCookieFile = z.infer<typeof sealedCookieFileSchema>;
