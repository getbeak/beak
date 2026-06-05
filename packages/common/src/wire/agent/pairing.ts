import { z } from 'zod';

export const pairCodeChallengeMethodSchema = z.literal('S256');

export const pairInitQuerySchema = z.object({
	origin: z.string().min(1),
	state: z.string().min(1),
	code_challenge: z.string().min(1),
	code_challenge_method: pairCodeChallengeMethodSchema,
	return: z.string().min(1),
});

export const pairTokenRequestSchema = z.object({
	code: z.string().min(1),
	code_verifier: z.string().min(1),
});

export const pairTokenResponseSchema = z.object({
	token: z.string().min(1),
	tokenId: z.string().min(1),
});

export const pairErrorResponseSchema = z.object({
	error: z.enum(['invalid_request', 'access_denied', 'invalid_grant']),
	error_description: z.string().optional(),
});

export type PairInitQueryWire = z.infer<typeof pairInitQuerySchema>;
export type PairTokenRequestWire = z.infer<typeof pairTokenRequestSchema>;
export type PairTokenResponseWire = z.infer<typeof pairTokenResponseSchema>;
export type PairErrorResponseWire = z.infer<typeof pairErrorResponseSchema>;
