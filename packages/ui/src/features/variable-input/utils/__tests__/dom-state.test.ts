import { afterEach, describe, expect, it, vi } from 'vitest';

import { parseDomState } from '../dom-state';

function makeRoot(html: string): HTMLElement {
	const root = document.createElement('div');
	root.innerHTML = html;
	return root;
}

afterEach(() => {
	vi.restoreAllMocks();
});

describe('parseDomState', () => {
	it('returns empty result when root is null', () => {
		expect(parseDomState(null)).toEqual({ valueParts: [], anomalyDetected: false });
	});

	it('treats text nodes as plain string parts', () => {
		const root = makeRoot('hello world');
		expect(parseDomState(root)).toEqual({
			valueParts: ['hello world'],
			anomalyDetected: false,
		});
	});

	it('treats SPAN content as plain string parts', () => {
		const root = makeRoot('<span>a</span><span>b</span>');
		expect(parseDomState(root)).toEqual({
			valueParts: ['a', 'b'],
			anomalyDetected: false,
		});
	});

	it('parses DIV tokens via data-type / data-payload', () => {
		const root = makeRoot('<div data-type="uuid" data-payload="{&quot;version&quot;:&quot;v4&quot;}"></div>');
		const result = parseDomState(root);
		expect(result.anomalyDetected).toBe(false);
		expect(result.valueParts).toHaveLength(1);
		expect(result.valueParts[0]).toEqual({
			type: 'uuid',
			payload: { version: 'v4' },
		});
	});

	it('DIV without data-payload yields undefined payload', () => {
		const root = makeRoot('<div data-type="request_name"></div>');
		expect(parseDomState(root).valueParts[0]).toEqual({
			type: 'request_name',
			payload: undefined,
		});
	});

	it('ignores BR nodes (browser edge case)', () => {
		const root = makeRoot('foo<br>bar');
		expect(parseDomState(root).valueParts).toEqual(['foo', 'bar']);
	});

	it('flags unknown nodes as anomaly', () => {
		const root = makeRoot('<p>unknown</p>');
		const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
		const result = parseDomState(root);
		expect(result.anomalyDetected).toBe(true);
		expect(errSpy).toHaveBeenCalled();
	});

	it('detects `?` and calls the URL-query callback', () => {
		const root = makeRoot('foo?bar');
		const detected = vi.fn();
		const blur = vi.fn();
		const result = parseDomState(root, {
			onUrlQueryStringDetection: detected,
			onQueryStringBlur: blur,
		});
		expect(detected).toHaveBeenCalledOnce();
		expect(blur).toHaveBeenCalledOnce();
		// The `?` should be stripped from the parsed parts.
		expect(result.valueParts).toEqual(['foobar']);
	});

	it('mixes text + token parts in order', () => {
		const root = makeRoot('a<div data-type="uuid" data-payload="{}"></div>b');
		const parts = parseDomState(root).valueParts;
		expect(parts).toHaveLength(3);
		expect(parts[0]).toBe('a');
		expect(parts[1]).toEqual({ type: 'uuid', payload: {} });
		expect(parts[2]).toBe('b');
	});

	it('strips the zero-width caret anchor from string parts', () => {
		const root = makeRoot('<span data-index="0">​hello​</span>');
		expect(parseDomState(root).valueParts).toEqual(['hello']);
	});

	it('skips an untouched tail caret anchor', () => {
		const root = makeRoot('<div data-type="uuid" data-payload="{}"></div><span data-anchor="tail">​</span>');
		expect(parseDomState(root).valueParts).toEqual([{ type: 'uuid', payload: {} }]);
	});

	it('treats a typed-into tail anchor as a normal string part', () => {
		const root = makeRoot('<div data-type="uuid" data-payload="{}"></div><span data-anchor="tail">​/profile</span>');
		expect(parseDomState(root).valueParts).toEqual([{ type: 'uuid', payload: {} }, '/profile']);
	});

	it('skips a gap anchor between two consecutive blobs', () => {
		const root = makeRoot(
			'<div data-type="uuid" data-payload="{}"></div><span data-anchor="gap">​</span><div data-type="nonce" data-payload="{}"></div>',
		);
		expect(parseDomState(root).valueParts).toEqual([
			{ type: 'uuid', payload: {} },
			{ type: 'nonce', payload: {} },
		]);
	});
});
