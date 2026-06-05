import { describe, expect, it } from 'vitest';

import {
	editorPreferencesSchema,
	projectFileSchema,
	projectPanePreferencesSchema,
	requestFileSchema,
	requestPreferenceSchema,
	sidebarPreferencesSchema,
	tabPreferencesSchema,
	toJsonSchema,
} from '..';

describe('preferences schemas', () => {
	it('editor preferences: accepts well-formed input', () => {
		const r = editorPreferencesSchema.safeParse({ selectedVariableSets: { foo: 'bar' } });
		expect(r.success).toBe(true);
	});

	it('editor preferences: rejects empty group selection value', () => {
		const r = editorPreferencesSchema.safeParse({ selectedVariableSets: { foo: '' } });
		expect(r.success).toBe(false);
	});

	it('sidebar preferences: enforces enum on selected', () => {
		expect(sidebarPreferencesSchema.safeParse({ selected: 'project', collapsed: {} }).success).toBe(true);
		expect(sidebarPreferencesSchema.safeParse({ selected: 'nope', collapsed: {} }).success).toBe(false);
	});

	it('project pane preferences: empty collapsed map is ok', () => {
		expect(projectPanePreferencesSchema.safeParse({ collapsed: {} }).success).toBe(true);
	});

	it('request preference: requires request and response', () => {
		const valid = {
			request: { mainTab: 'headers' },
			response: { mainTab: 'response', subTab: {}, pretty: {} },
		};
		expect(requestPreferenceSchema.safeParse(valid).success).toBe(true);

		const missingResponse = { request: { mainTab: 'headers' } };
		expect(requestPreferenceSchema.safeParse(missingResponse).success).toBe(false);
	});

	it('tab preferences: discriminates request / variable_set_editor / new_project_intro / preferences', () => {
		const tabs = [
			{ type: 'request', payload: 'r1', temporary: false },
			{ type: 'variable_set_editor', payload: 'v1', temporary: true },
			{ type: 'new_project_intro', payload: 'new_project_intro', temporary: false },
			{ type: 'preferences', payload: 'preferences', temporary: false },
		];
		expect(tabPreferencesSchema.safeParse({ tabs }).success).toBe(true);
	});

	it('tab preferences: preferences tab rejects an unexpected payload', () => {
		const tabs = [{ type: 'preferences', payload: 'oops', temporary: false }];
		expect(tabPreferencesSchema.safeParse({ tabs }).success).toBe(false);
	});

	it('tab preferences: rejects unknown tab type', () => {
		const tabs = [{ type: 'wat', payload: 'x', temporary: false }];
		expect(tabPreferencesSchema.safeParse({ tabs }).success).toBe(false);
	});
});

describe('beak-project schemas', () => {
	it('project file: requires id/version/name', () => {
		expect(projectFileSchema.safeParse({ id: 'p1', version: '1', name: 'demo' }).success).toBe(true);
		expect(projectFileSchema.safeParse({ id: 'p1', name: 'demo' }).success).toBe(false);
	});

	it('project file: rejects empty id', () => {
		expect(projectFileSchema.safeParse({ id: '', version: '1', name: 'demo' }).success).toBe(false);
	});

	it('request file: accepts a minimal request', () => {
		const minimal = {
			id: 'r1',
			verb: 'GET',
			url: ['https://example.com'],
			query: {},
			headers: {},
		};
		expect(requestFileSchema.safeParse(minimal).success).toBe(true);
	});

	it('request file: accepts a request with each body type', () => {
		const base = {
			id: 'r1',
			verb: 'POST',
			url: ['x'],
			query: {},
			headers: {},
		};
		expect(requestFileSchema.safeParse({ ...base, body: { type: 'text', payload: 'hi' } }).success).toBe(true);
		expect(requestFileSchema.safeParse({ ...base, body: { type: 'json', payload: {} } }).success).toBe(true);
		expect(requestFileSchema.safeParse({ ...base, body: { type: 'url_encoded_form', payload: {} } }).success).toBe(true);
		expect(requestFileSchema.safeParse({ ...base, body: { type: 'file', payload: {} } }).success).toBe(true);
		expect(
			requestFileSchema.safeParse({
				...base,
				body: { type: 'graphql', payload: { query: '{ ping }', variables: {} } },
			}).success,
		).toBe(true);
	});

	it('request file: rejects an unknown body type', () => {
		const r = requestFileSchema.safeParse({
			id: 'r1',
			verb: 'GET',
			url: ['x'],
			query: {},
			headers: {},
			body: { type: 'unknown', payload: {} },
		});
		expect(r.success).toBe(false);
	});

	it('request file: ValueParts accepts mix of strings and realtime-value refs', () => {
		const r = requestFileSchema.safeParse({
			id: 'r1',
			verb: 'GET',
			url: ['hello ', { type: 'uuid', payload: { version: 'v4' } }],
			query: {},
			headers: {},
		});
		expect(r.success).toBe(true);
	});
});

describe('toJsonSchema', () => {
	it('produces a JSON Schema document from a zod schema', () => {
		const json = toJsonSchema(sidebarPreferencesSchema) as Record<string, unknown>;
		expect(json.type).toBe('object');
		expect(json).toHaveProperty('properties');
		expect((json as { required?: string[] }).required).toEqual(expect.arrayContaining(['selected', 'collapsed']));
	});
});
