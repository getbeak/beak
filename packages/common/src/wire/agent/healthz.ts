import { z } from 'zod';

export const healthzResponseSchema = z.object({
	agent: z.literal('beak'),
	version: z.string(),
	supports: z.array(z.string()),
	// Present only when the request carried `?nonce=…` AND a valid bearer
	// token. `signature = base64url(hmac_sha256(token, nonce))`. The renderer
	// recomputes client-side to defeat localhost impersonators.
	nonce: z.string().optional(),
	signature: z.string().optional(),
});

export type HealthzResponseWire = z.infer<typeof healthzResponseSchema>;
