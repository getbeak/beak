import { describe, expect, it } from 'vitest';

import { friendlyPairingError } from '../error-messages';

describe('friendlyPairingError', () => {
	it('maps a known pairing code to its friendly entry', () => {
		const out = friendlyPairingError('pairing_no_pending');
		expect(out.title).toMatch(/expired/i);
		expect(out.detail).toMatch(/start pairing again/i);
	});

	it('maps a known agent code to its friendly entry', () => {
		const out = friendlyPairingError('agent_unreachable');
		expect(out.title).toMatch(/couldn.t reach/i);
	});

	it('extracts HTTP status from token-exchange failures', () => {
		const out = friendlyPairingError('pairing_token_exchange_failed_400_grant invalid');
		expect(out.title).toMatch(/rejected/i);
		expect(out.detail).toMatch(/HTTP 400/);
		expect(out.detail).not.toMatch(/grant invalid/);
	});

	it('returns a default when code is undefined', () => {
		const out = friendlyPairingError(undefined);
		expect(out.title).toMatch(/didn.t finish/i);
	});

	it('surfaces the raw code in detail for unknown errors so support can act on it', () => {
		const out = friendlyPairingError('some_brand_new_failure');
		expect(out.detail).toMatch(/some_brand_new_failure/);
	});
});
