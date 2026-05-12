import type { ValuePart, ValueSections } from '@beak/ui/features/variables/values';
import { describe, expect, it } from 'vitest';

import { insertVariableIntoParts } from '../variable-insertion';
import type { VariableSelectionState } from '../variables';

const variable: ValuePart = { type: 'uuid', payload: { version: 'v4' } };

function selection(partIndex: number, offset: number, queryTrailingLength: number): VariableSelectionState {
	return {
		queryStartSelection: { partIndex, offset, isTextNode: true },
		queryTrailingLength,
	};
}

describe('insertVariableIntoParts', () => {
	it('prepend: variable goes before the only string part, query removed from the front', () => {
		// User typed `{q` at the very start, single part is `{q`.
		const parts: ValueSections = ['{q'];
		// queryStartSelection: partIndex 0, offset 1 (right after `{`)
		// queryTrailingLength: 0 (nothing after the typed query)
		const result = insertVariableIntoParts(parts, selection(0, 1, 0), variable, 1);
		expect(result.parts).toEqual([variable, '']);
		expect(result.selection.partIndex).toBe(1);
		expect(result.closeSelector).toBe(true);
	});

	it('end-of-string `{q` still surrounds the variable with text on both sides (inject branch)', () => {
		// `hello {q` — partIndex 0, offset 7 (post `{`), queryTrailingLength 0
		// determineInsertionMode picks `inject` here, so we get pre/variable/post even though post is empty.
		const parts: ValueSections = ['hello {q'];
		const result = insertVariableIntoParts(parts, selection(0, 7, 0), variable, 1);
		expect(result.parts).toEqual(['hello ', variable, '']);
		expect(result.selection.partIndex).toBe(1);
	});

	it('inject: variable splits the string into pre / variable / post', () => {
		// `aaa{qbbb` — partIndex 0, offset 4 (after `{`), queryTrailingLength 3 (`bbb`)
		const parts: ValueSections = ['aaa{qbbb'];
		const result = insertVariableIntoParts(parts, selection(0, 4, 3), variable, 1);
		expect(result.parts).toEqual(['aaa', variable, 'bbb']);
		// inject → newPartSelectionIndex = partIndex + 1 = 1 (on the variable)
		expect(result.selection.partIndex).toBe(1);
	});

	it('selection lands at offset 0 of the new variable position', () => {
		const parts: ValueSections = ['{q'];
		const result = insertVariableIntoParts(parts, selection(0, 1, 0), variable, 1);
		expect(result.selection.offset).toBe(0);
		expect(result.selection.isTextNode).toBe(false);
	});
});
