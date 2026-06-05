import { describe, expect, it } from 'vitest';

import { looksLikeOpenApi3, parseSpecSource } from '../parse-spec-source';

describe('parseSpecSource', () => {
	it('parses valid JSON to an object', () => {
		const r = parseSpecSource('{"openapi":"3.0.0","info":{"title":"x"}}');
		expect(r.ok).toBe(true);
		if (r.ok) expect((r.spec as { openapi: string }).openapi).toBe('3.0.0');
	});

	it('returns a friendly error for empty input', () => {
		const r = parseSpecSource('');
		expect(r.ok).toBe(false);
		if (!r.ok) expect(r.error).toMatch(/empty/);
	});

	it('returns a friendly error for invalid JSON', () => {
		const r = parseSpecSource('{ not actually json');
		expect(r.ok).toBe(false);
		if (!r.ok) expect(r.error).toMatch(/Failed to parse spec as JSON/);
	});

	it('rejects a primitive at the top level', () => {
		const r = parseSpecSource('42');
		expect(r.ok).toBe(false);
		if (!r.ok) expect(r.error).toMatch(/object/);
	});

	it('parses a YAML spec when the filename ends in .yaml', () => {
		const yaml = ['openapi: 3.0.0', 'info:', '  title: x', '  version: "1"'].join('\n');
		const r = parseSpecSource(yaml, 'spec.yaml');
		expect(r.ok).toBe(true);
		if (r.ok) expect((r.spec as { openapi: string }).openapi).toBe('3.0.0');
	});

	it('parses a YAML spec when the filename ends in .yml', () => {
		const r = parseSpecSource('openapi: "3.1.0"\ninfo: { title: x }\n', 'spec.yml');
		expect(r.ok).toBe(true);
	});

	it('falls back to YAML for content with no extension hint', () => {
		const r = parseSpecSource('openapi: 3.0.0\ninfo: { title: x }');
		expect(r.ok).toBe(true);
	});

	it('reports YAML errors when a .yaml file is malformed', () => {
		const r = parseSpecSource('openapi: 3.0.0\ninfo:\n  title: x\n  bad: : :', 'spec.yaml');
		expect(r.ok).toBe(false);
		if (!r.ok) expect(r.error).toMatch(/Failed to parse spec as YAML/);
	});

	it('accepts a JSON spec saved with a .yaml extension (sniffs by content)', () => {
		const r = parseSpecSource('{"openapi":"3.0.0","info":{"title":"x"}}', 'spec.yaml');
		expect(r.ok).toBe(true);
	});

	it('rejects a YAML doc that resolves to a primitive', () => {
		const r = parseSpecSource('hello world', 'spec.yaml');
		expect(r.ok).toBe(false);
		if (!r.ok) expect(r.error).toMatch(/object/);
	});
});

describe('looksLikeOpenApi3', () => {
	it('accepts a 3.x document', () => {
		expect(looksLikeOpenApi3({ openapi: '3.0.0' })).toBe(true);
		expect(looksLikeOpenApi3({ openapi: '3.1.0' })).toBe(true);
	});

	it('rejects a 2.x document', () => {
		expect(looksLikeOpenApi3({ openapi: '2.0' })).toBe(false);
	});

	it('rejects anything without an openapi string', () => {
		expect(looksLikeOpenApi3({})).toBe(false);
		expect(looksLikeOpenApi3(null)).toBe(false);
		expect(looksLikeOpenApi3('foo')).toBe(false);
	});
});
