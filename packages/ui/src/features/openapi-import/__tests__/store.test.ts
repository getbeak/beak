import { describe, expect, it } from 'vitest';

import { actions } from '../store';
import reducer from '../store/reducer';
import { initialState } from '../store/types';

describe('openapi-import slice', () => {
	it('starts the flow in picking-file', () => {
		const next = reducer(initialState, actions.start());
		expect(next.phase).toBe('picking-file');
		expect(next.file).toBeUndefined();
		expect(next.result).toBeUndefined();
	});

	it('advances to picking-folder once a file is picked', () => {
		const a = reducer(initialState, actions.start());
		const b = reducer(a, actions.filePicked({ filename: 'spec.json', source: '{}' }));
		expect(b.phase).toBe('picking-folder');
		expect(b.file).toEqual({ filename: 'spec.json', source: '{}' });
	});

	it('returns to idle when the file picker is cancelled', () => {
		const a = reducer(initialState, actions.start());
		const b = reducer(a, actions.filePickCancelled());
		expect(b.phase).toBe('idle');
		expect(b.file).toBeUndefined();
	});

	it('captures the chosen target folder and moves to importing', () => {
		const a = reducer(initialState, actions.start());
		const b = reducer(a, actions.filePicked({ filename: 'spec.json', source: '{}' }));
		const c = reducer(b, actions.folderChosen({ targetFolder: 'tree/apis/payments' }));
		expect(c.phase).toBe('importing');
		expect(c.targetFolder).toBe('tree/apis/payments');
	});

	it('lands the success outcome in result phase', () => {
		const a = reducer(initialState, actions.start());
		const b = reducer(a, actions.filePicked({ filename: 'spec.json', source: '{}' }));
		const c = reducer(b, actions.folderChosen({ targetFolder: 'tree/x' }));
		const d = reducer(
			c,
			actions.importResolved({
				outcome: {
					collectionPath: 'tree/x/_collection.json',
					requestPaths: ['tree/x/get-users.json'],
					overwritten: [],
					skipped: [],
					warnings: [],
				},
				notice: 'Wrote 1 request.',
			}),
		);
		expect(d.phase).toBe('result');
		expect(d.result).toEqual({
			ok: true,
			outcome: expect.objectContaining({ collectionPath: 'tree/x/_collection.json' }),
			notice: 'Wrote 1 request.',
		});
	});

	it('lands the failure outcome in result phase', () => {
		const a = reducer(initialState, actions.start());
		const b = reducer(a, actions.filePicked({ filename: 'spec.json', source: '{}' }));
		const c = reducer(b, actions.folderChosen({ targetFolder: 'tree/x' }));
		const d = reducer(c, actions.importRejected({ error: 'targetFolder escapes' }));
		expect(d.phase).toBe('result');
		expect(d.result).toEqual({ ok: false, error: 'targetFolder escapes' });
	});

	it('close() resets to idle from anywhere', () => {
		const a = reducer(initialState, actions.start());
		const b = reducer(a, actions.filePicked({ filename: 'spec.json', source: '{}' }));
		const c = reducer(b, actions.close());
		expect(c.phase).toBe('idle');
		expect(c.file).toBeUndefined();
		expect(c.result).toBeUndefined();
	});
});
