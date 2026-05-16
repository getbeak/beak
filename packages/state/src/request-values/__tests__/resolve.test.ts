import type { RequestOverview } from '@getbeak/types/request';
import { describe, expect, it } from 'vitest';

import { emptyRequestValues, type RequestValues } from '../../schemas/request-values';
import { resolveLegacyWithValues } from '../resolve';

function legacy(body: RequestOverview['body']): RequestOverview {
	return {
		verb: 'post',
		url: ['https://api.example.com/v1/things'],
		query: {
			q1: { name: 'limit', value: ['25'], enabled: true },
		},
		headers: {
			h1: { name: 'Authorization', value: ['legacy-token'], enabled: true },
		},
		body,
		options: { followRedirects: true },
	};
}

describe('resolveLegacyWithValues', () => {
	it('returns the legacy overview untouched when values are absent', () => {
		const overview = legacy({ type: 'text', payload: 'hi' });
		expect(resolveLegacyWithValues(overview, null)).toBe(overview);
	});

	it('overlays a string header value from the slice over the legacy entry', () => {
		const overview = legacy({ type: 'text', payload: '' });
		const values: RequestValues = {
			...emptyRequestValues(),
			headers: {
				h1: { kind: 'string', value: ['Bearer slice-token'], enabled: true },
			},
		};
		const resolved = resolveLegacyWithValues(overview, values);
		expect(resolved.headers.h1).toEqual({
			name: 'Authorization',
			value: ['Bearer slice-token'],
			enabled: true,
		});
	});

	it('leaves legacy header alone when slice has no entry for that id', () => {
		const overview = legacy({ type: 'text', payload: '' });
		const resolved = resolveLegacyWithValues(overview, emptyRequestValues());
		expect(resolved.headers.h1.value).toEqual(['legacy-token']);
	});

	it('overlays text body payload', () => {
		const overview = legacy({ type: 'text', payload: 'legacy body' });
		const values: RequestValues = {
			...emptyRequestValues(),
			body: { type: 'text', payload: 'slice body' },
		};
		const resolved = resolveLegacyWithValues(overview, values);
		expect(resolved.body).toEqual({ type: 'text', payload: 'slice body' });
	});

	it('overlays json body entry values, leaves tree shape alone', () => {
		const overview = legacy({
			type: 'json',
			payload: {
				root: { id: 'root', parentId: null, enabled: true, type: 'object' },
				name: {
					id: 'name',
					parentId: 'root',
					enabled: true,
					type: 'string',
					name: 'name',
					value: ['Mel'],
				},
				age: {
					id: 'age',
					parentId: 'root',
					enabled: true,
					type: 'number',
					name: 'age',
					value: ['33'],
				},
			},
		});
		const values: RequestValues = {
			...emptyRequestValues(),
			body: {
				type: 'json',
				values: {
					name: { kind: 'string', value: ['Sky'], enabled: true },
				},
			},
		};
		const resolved = resolveLegacyWithValues(overview, values);
		expect(resolved.body).toMatchObject({
			type: 'json',
			payload: {
				root: { id: 'root', parentId: null, enabled: true, type: 'object' },
				name: { type: 'string', name: 'name', value: ['Sky'] },
				age: { type: 'number', name: 'age', value: ['33'] },
			},
		});
	});

	it('ignores body overlay when the slice body type differs from legacy', () => {
		const overview = legacy({ type: 'text', payload: 'legacy' });
		const values: RequestValues = {
			...emptyRequestValues(),
			body: { type: 'json', values: {} },
		};
		const resolved = resolveLegacyWithValues(overview, values);
		expect(resolved.body).toEqual({ type: 'text', payload: 'legacy' });
	});

	it('preserves verb / url / options unconditionally', () => {
		const overview = legacy({ type: 'text', payload: '' });
		const values: RequestValues = {
			...emptyRequestValues(),
			headers: { h1: { kind: 'string', value: ['x'], enabled: false } },
		};
		const resolved = resolveLegacyWithValues(overview, values);
		expect(resolved.verb).toBe('post');
		expect(resolved.url).toEqual(['https://api.example.com/v1/things']);
		expect(resolved.options).toEqual({ followRedirects: true });
		// Slice enabled=false flows through.
		expect(resolved.headers.h1.enabled).toBe(false);
	});
});
