import { describe, expect, it } from 'vitest';

import { parseQuery } from '../search';

/**
 * `parseQuery` is the input router that decides which scope the omni-bar
 * runs in. Each prefix (`>`, `~`, `#`) is a hard contract — the rest of the
 * UI (mode icon, placeholder, footer chip) trusts the scope, so a typo here
 * lights up the wrong colour and filters out unrelated items. These cases
 * pin the behaviour down before that drift can happen.
 */
describe('parseQuery', () => {
	it('returns the all-scope for plain input', () => {
		expect(parseQuery('foo')).toEqual({ rawText: 'foo', queryText: 'foo', categoryScope: 'all' });
	});

	it('returns the all-scope for an empty input', () => {
		expect(parseQuery('')).toEqual({ rawText: '', queryText: '', categoryScope: 'all' });
	});

	it('routes > to the commands scope', () => {
		expect(parseQuery('>reload').categoryScope).toBe('commands');
		expect(parseQuery('>reload').queryText).toBe('reload');
	});

	it('routes ~ to the recents scope', () => {
		expect(parseQuery('~').categoryScope).toBe('recents');
		expect(parseQuery('~auth').queryText).toBe('auth');
	});

	it('routes # to the workflows scope', () => {
		expect(parseQuery('#').categoryScope).toBe('workflows');
		expect(parseQuery('#auth').queryText).toBe('auth');
	});

	it('skips leading whitespace before reading the prefix', () => {
		expect(parseQuery('   #auth').categoryScope).toBe('workflows');
		expect(parseQuery('   >reload').categoryScope).toBe('commands');
	});

	it('trims whitespace after the prefix', () => {
		expect(parseQuery('#   auth').queryText).toBe('auth');
		expect(parseQuery('>   reload').queryText).toBe('reload');
		expect(parseQuery('~   ').queryText).toBe('');
	});

	it('preserves the rawText verbatim regardless of prefix', () => {
		expect(parseQuery('  #foo').rawText).toBe('  #foo');
		expect(parseQuery('>cmd').rawText).toBe('>cmd');
	});

	it('treats a prefix character mid-string as plain text', () => {
		expect(parseQuery('hash# nope').categoryScope).toBe('all');
		expect(parseQuery('hash# nope').queryText).toBe('hash# nope');
	});
});
