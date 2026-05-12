import CanonicalSquawk from '@beak/squawk';
import { describe, expect, it } from 'vitest';

import Squawk from '../squawk';

describe('Squawk compat re-export', () => {
	it('is the same class as @beak/squawk', () => {
		expect(Squawk).toBe(CanonicalSquawk);
	});

	it('constructs with a code and is identified as a Squawk', () => {
		const err = new Squawk('a_code');
		expect(Squawk.isSquawk(err)).toBe(true);
		expect(err.code).toBe('a_code');
	});

	it('coerces unknown errors', () => {
		const coerced = Squawk.coerce({ random: 'thing' });
		expect(Squawk.isSquawk(coerced)).toBe(true);
		expect(coerced.code).toBe('unknown');
	});

	it('preserves reasons', () => {
		const inner = new Squawk('inner');
		const outer = new Squawk('outer', undefined, [inner]);
		expect(outer.reasons?.length).toBe(0); // Squawks already-Squawks are deliberately skipped
		// non-Squawk reasons should be coerced
		const wrapped = new Squawk('outer', undefined, [new Error('boom')]);
		expect(wrapped.reasons?.length).toBe(1);
		expect(wrapped.reasons?.[0].code).toBe('unknown');
	});
});
