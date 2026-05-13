import CanonicalSquawk, { BeakError, NotFoundError, ValidationError } from '@beak/squawk';
import { describe, expect, it } from 'vitest';

import Squawk from '../squawk';

describe('Squawk compat re-export', () => {
	it('is the same class as @beak/squawk', () => {
		expect(Squawk).toBe(CanonicalSquawk);
	});

	it('BeakError is the same class', () => {
		expect(BeakError).toBe(CanonicalSquawk);
	});

	it('constructs with a code and is identified as a Squawk', () => {
		const err = new Squawk('a_code');
		expect(Squawk.isSquawk(err)).toBe(true);
		expect(err.code).toBe('a_code');
		expect(err.kind).toBe('a_code');
		expect(err.message).toBe('a_code');
	});

	it('coerces unknown errors', () => {
		const coerced = Squawk.coerce({ random: 'thing' });
		expect(Squawk.isSquawk(coerced)).toBe(true);
		expect(coerced.code).toBe('unknown');
	});

	it('coerces native Error into a Squawk', () => {
		const inner = new Error('boom');
		const coerced = Squawk.coerce(inner);
		expect(Squawk.isSquawk(coerced)).toBe(true);
		expect(coerced.code).toBe('unknown');
		expect(coerced.message).toBe('boom');
		expect(coerced.meta.message).toBe('boom');
	});

	it('preserves reasons (native errors are coerced)', () => {
		const wrapped = new Squawk('outer', undefined, [new Error('boom')]);
		expect(wrapped.reasons.length).toBe(1);
		expect(wrapped.reasons[0].code).toBe('unknown');
		expect(wrapped.reasons[0].message).toBe('boom');
	});

	it('also accepts the options-object constructor', () => {
		const err = new Squawk('thing_broke', {
			meta: { filePath: '/a/b/c.json' },
			httpStatus: 422,
			message: 'Custom summary',
		});
		expect(err.meta.filePath).toBe('/a/b/c.json');
		expect(err.httpStatus).toBe(422);
		expect(err.message).toBe('Custom summary');
	});

	it('serialises to a stable shape', () => {
		const err = new Squawk('x', { meta: { id: '123' } });
		const out = err.serialize();
		expect(out.kind).toBe('x');
		expect(out.meta).toEqual({ id: '123' });
		expect(out.reasons).toEqual([]);
	});

	describe('ValidationError.fromZodError', () => {
		it('flattens path + message into fieldErrors', () => {
			const zodError = {
				issues: [
					{ path: ['user', 'email'], message: 'Invalid email' },
					{ path: ['user', 'age'], message: 'Must be positive' },
				],
			};
			const err = ValidationError.fromZodError(zodError, { filePath: '/x.json' });
			expect(err.code).toBe('schema_invalid');
			expect(err.httpStatus).toBe(422);
			expect(err.meta.fieldErrors).toEqual({
				'user.email': 'Invalid email',
				'user.age': 'Must be positive',
			});
			expect(err.meta.filePath).toBe('/x.json');
			expect(err.message).toMatch(/2 issues/);
		});

		it('uses (root) for empty paths', () => {
			const err = ValidationError.fromZodError({ issues: [{ path: [], message: 'wrong shape' }] });
			expect(err.meta.fieldErrors).toEqual({ '(root)': 'wrong shape' });
		});
	});

	describe('NotFoundError', () => {
		it('builds a human message and 404 status', () => {
			const err = new NotFoundError('Project', 'abc123');
			expect(err.code).toBe('Project_not_found');
			expect(err.httpStatus).toBe(404);
			expect(err.message).toBe('Project not found: abc123');
			expect(err.meta.id).toBe('abc123');
		});
	});

	describe('BeakError.toUserMessage', () => {
		it('returns Squawk message verbatim', () => {
			const err = new Squawk('foo', { message: 'Friendly text' });
			expect(BeakError.toUserMessage(err)).toBe('Friendly text');
		});

		it('returns generic message + logs unknown errors', () => {
			let logged: unknown;
			const msg = BeakError.toUserMessage({ weird: true }, e => {
				logged = e;
			});
			expect(msg).toBe('An unknown error occurred');
			expect(logged).toEqual({ weird: true });
		});
	});
});
