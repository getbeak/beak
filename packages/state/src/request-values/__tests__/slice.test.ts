import { describe, expect, it } from 'vitest';

import { emptyRequestValues } from '../../schemas/request-values';
import {
	clearBodyPropertyValue,
	clearScalarValue,
	hydrateRequestValues,
	removeRequestValues,
	replaceRequestValues,
	setBodyPropertyValue,
	setBodyValue,
	setScalarValue,
	toggleScalarEnabled,
} from '../actions';
import requestValuesReducer from '../request-values-slice';

const emptyState = requestValuesReducer(undefined, { type: '@@INIT' });

describe('request-values slice', () => {
	it('hydrate loads bulk + flips loaded flag', () => {
		const next = requestValuesReducer(
			emptyState,
			hydrateRequestValues({
				requests: {
					r1: {
						headers: { h1: { kind: 'string', value: ['v'], enabled: true } },
						query: {},
						body: { type: 'none' },
					},
				},
			}),
		);
		expect(next.loaded).toBe(true);
		expect(next.requests.r1?.headers.h1?.enabled).toBe(true);
	});

	it('replace overwrites one request', () => {
		const seeded = requestValuesReducer(
			emptyState,
			hydrateRequestValues({ requests: { r1: emptyRequestValues() } }),
		);
		const next = requestValuesReducer(
			seeded,
			replaceRequestValues({
				requestId: 'r1',
				values: {
					headers: { h1: { kind: 'string', value: ['x'], enabled: true } },
					query: {},
					body: { type: 'none' },
				},
			}),
		);
		expect(next.requests.r1?.headers.h1?.value).toEqual(['x']);
	});

	it('remove drops the request', () => {
		const seeded = requestValuesReducer(
			emptyState,
			hydrateRequestValues({ requests: { r1: emptyRequestValues() } }),
		);
		const next = requestValuesReducer(seeded, removeRequestValues({ requestId: 'r1' }));
		expect(next.requests.r1).toBeUndefined();
	});

	it('setScalarValue creates the request envelope on demand', () => {
		const next = requestValuesReducer(
			emptyState,
			setScalarValue({
				requestId: 'r1',
				scope: 'headers',
				propertyId: 'h1',
				value: { kind: 'string', value: ['hello'], enabled: true },
			}),
		);
		expect(next.requests.r1?.headers.h1?.value).toEqual(['hello']);
		expect(next.requests.r1?.body.type).toBe('none');
	});

	it('clearScalarValue removes one cell', () => {
		const seeded = requestValuesReducer(
			emptyState,
			setScalarValue({
				requestId: 'r1',
				scope: 'query',
				propertyId: 'q1',
				value: { kind: 'string', value: ['v'], enabled: true },
			}),
		);
		const next = requestValuesReducer(
			seeded,
			clearScalarValue({ requestId: 'r1', scope: 'query', propertyId: 'q1' }),
		);
		expect(next.requests.r1?.query.q1).toBeUndefined();
	});

	it('toggleScalarEnabled flips the flag', () => {
		const seeded = requestValuesReducer(
			emptyState,
			setScalarValue({
				requestId: 'r1',
				scope: 'headers',
				propertyId: 'h1',
				value: { kind: 'string', value: ['v'], enabled: true },
			}),
		);
		const next = requestValuesReducer(
			seeded,
			toggleScalarEnabled({
				requestId: 'r1',
				scope: 'headers',
				propertyId: 'h1',
				enabled: false,
			}),
		);
		expect(next.requests.r1?.headers.h1?.enabled).toBe(false);
	});

	it('setBodyValue replaces the body cell', () => {
		const next = requestValuesReducer(
			emptyState,
			setBodyValue({
				requestId: 'r1',
				body: { type: 'text', payload: 'hi' },
			}),
		);
		expect(next.requests.r1?.body).toEqual({ type: 'text', payload: 'hi' });
	});

	it('setBodyPropertyValue writes into json body values', () => {
		const seeded = requestValuesReducer(
			emptyState,
			setBodyValue({
				requestId: 'r1',
				body: { type: 'json', values: {} },
			}),
		);
		const next = requestValuesReducer(
			seeded,
			setBodyPropertyValue({
				requestId: 'r1',
				propertyId: 'n1',
				value: { kind: 'string', value: ['x'], enabled: true },
			}),
		);
		expect(next.requests.r1?.body).toMatchObject({
			type: 'json',
			values: { n1: { value: ['x'] } },
		});
	});

	it('setBodyPropertyValue writes into graphql variables', () => {
		const seeded = requestValuesReducer(
			emptyState,
			setBodyValue({
				requestId: 'r1',
				body: { type: 'graphql', query: '{ me }', variables: {} },
			}),
		);
		const next = requestValuesReducer(
			seeded,
			setBodyPropertyValue({
				requestId: 'r1',
				propertyId: 'v1',
				value: { kind: 'string', value: ['x'], enabled: true },
			}),
		);
		expect(next.requests.r1?.body).toMatchObject({
			type: 'graphql',
			variables: { v1: { value: ['x'] } },
		});
	});

	it('setBodyPropertyValue is a no-op for unstructured bodies', () => {
		const seeded = requestValuesReducer(
			emptyState,
			setBodyValue({
				requestId: 'r1',
				body: { type: 'text', payload: 'plain' },
			}),
		);
		const next = requestValuesReducer(
			seeded,
			setBodyPropertyValue({
				requestId: 'r1',
				propertyId: 'n1',
				value: { kind: 'string', value: ['x'], enabled: true },
			}),
		);
		expect(next.requests.r1?.body).toEqual({ type: 'text', payload: 'plain' });
	});

	it('clearBodyPropertyValue removes one structured-body entry', () => {
		const seeded1 = requestValuesReducer(
			emptyState,
			setBodyValue({
				requestId: 'r1',
				body: { type: 'json', values: {} },
			}),
		);
		const seeded2 = requestValuesReducer(
			seeded1,
			setBodyPropertyValue({
				requestId: 'r1',
				propertyId: 'n1',
				value: { kind: 'string', value: ['x'], enabled: true },
			}),
		);
		const next = requestValuesReducer(
			seeded2,
			clearBodyPropertyValue({ requestId: 'r1', propertyId: 'n1' }),
		);
		expect(next.requests.r1?.body).toMatchObject({ type: 'json', values: {} });
	});
});
