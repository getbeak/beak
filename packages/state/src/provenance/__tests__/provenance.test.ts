import { describe, expect, it } from 'vitest';

import { isLinked, isLinkedRawRecord, isUnlinked, stripProvenance, unlinkRequest } from '..';

describe('provenance/isLinked', () => {
	it('returns false for missing _provenance', () => {
		expect(isLinked({})).toBe(false);
		expect(isLinked(null)).toBe(false);
		expect(isLinked(undefined)).toBe(false);
	});

	it('returns true only for linked: true', () => {
		expect(isLinked({ _provenance: { source: 'openapi', linked: true } })).toBe(true);
		expect(isLinked({ _provenance: { source: 'openapi', linked: false } })).toBe(false);
	});
});

describe('provenance/isUnlinked', () => {
	it('is the negation of isLinked', () => {
		expect(isUnlinked({})).toBe(true);
		expect(isUnlinked({ _provenance: { source: 'openapi', linked: false } })).toBe(true);
		expect(isUnlinked({ _provenance: { source: 'openapi', linked: true } })).toBe(false);
	});
});

describe('provenance/unlinkRequest', () => {
	it('flips linked: true → false while preserving source + operationId', () => {
		const result = unlinkRequest({
			_provenance: { source: 'openapi', linked: true, operationId: 'getUser', syncedAt: '2026-05-17T00:00:00Z' },
			extra: 'kept',
		});
		expect(result._provenance).toEqual({
			source: 'openapi',
			linked: false,
			operationId: 'getUser',
			syncedAt: '2026-05-17T00:00:00Z',
		});
		expect((result as { extra: string }).extra).toBe('kept');
	});

	it('stamps openapi as default source when none exists', () => {
		const result = unlinkRequest({});
		expect(result._provenance).toEqual({ source: 'openapi', linked: false });
	});

	it('honours an explicit defaultSource for hand-authored unlinks', () => {
		const result = unlinkRequest({}, 'grpc');
		expect(result._provenance).toEqual({ source: 'grpc', linked: false });
	});

	it('is idempotent on already-unlinked requests', () => {
		const before = { _provenance: { source: 'openapi' as const, linked: false } };
		const after = unlinkRequest(before);
		expect(after._provenance).toEqual(before._provenance);
	});
});

describe('provenance/stripProvenance', () => {
	it('removes the _provenance field entirely', () => {
		const result = stripProvenance({
			_provenance: { source: 'openapi', linked: true },
			id: 'r-1',
		});
		expect(result).toEqual({ id: 'r-1' });
		expect('_provenance' in result).toBe(false);
	});

	it('is a no-op on inputs without _provenance', () => {
		const result = stripProvenance({ id: 'r-1' });
		expect(result).toEqual({ id: 'r-1' });
	});
});

describe('provenance/isLinkedRawRecord', () => {
	it('matches the strict-true semantic for the host-side raw parser', () => {
		expect(isLinkedRawRecord({ linked: true })).toBe(true);
		expect(isLinkedRawRecord({ linked: false })).toBe(false);
		expect(isLinkedRawRecord({})).toBe(false);
		expect(isLinkedRawRecord(null)).toBe(false);
		expect(isLinkedRawRecord(undefined)).toBe(false);
	});
});
