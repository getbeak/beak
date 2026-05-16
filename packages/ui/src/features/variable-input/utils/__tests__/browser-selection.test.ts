import { afterEach, describe, expect, it, vi } from 'vitest';

import { normalizeSelection, setSelection } from '../browser-selection';

function makeArticle(html: string): HTMLElement {
	const article = document.createElement('article');
	article.innerHTML = html;
	document.body.appendChild(article);
	return article;
}

function clearDoc() {
	document.body.innerHTML = '';
	window.getSelection()?.removeAllRanges();
}

afterEach(() => {
	clearDoc();
	vi.restoreAllMocks();
});

describe('normalizeSelection', () => {
	it('returns the provided fallback when there is no native selection', () => {
		const fallback = { isTextNode: false, partIndex: 2, offset: 4 };
		expect(normalizeSelection(fallback)).toEqual(fallback);
	});

	it('returns a zeroed default when there is no native selection and no fallback', () => {
		expect(normalizeSelection()).toEqual({ isTextNode: false, partIndex: 0, offset: 0 });
	});

	it('reports a text-node selection inside a SPAN child of ARTICLE', () => {
		const article = makeArticle('<span>hello</span>');
		const span = article.firstChild as HTMLElement;
		const text = span.firstChild!;

		const sel = window.getSelection()!;
		const range = document.createRange();
		range.setStart(text, 3);
		range.collapse(true);
		sel.removeAllRanges();
		sel.addRange(range);

		const out = normalizeSelection();
		expect(out.isTextNode).toBe(true);
		expect(out.partIndex).toBe(0);
		expect(out.offset).toBe(3);
	});

	it('reports a text-node selection inside the second SPAN child', () => {
		const article = makeArticle('<span>a</span><span>bc</span>');
		const span = article.childNodes[1] as HTMLElement;
		const text = span.firstChild!;

		const sel = window.getSelection()!;
		const range = document.createRange();
		range.setStart(text, 2);
		range.collapse(true);
		sel.removeAllRanges();
		sel.addRange(range);

		const out = normalizeSelection();
		expect(out.isTextNode).toBe(true);
		expect(out.partIndex).toBe(1);
		expect(out.offset).toBe(2);
	});

	it('falls back when the selection lives outside any ARTICLE ancestor', () => {
		// Selection in a stray DIV — simulates a stale/blurred range still
		// kept alive by the browser. Previously this walked off the top of
		// the tree and threw on `null.parentNode`.
		const stray = document.createElement('div');
		stray.textContent = 'outside the editor';
		document.body.appendChild(stray);
		const text = stray.firstChild!;

		const sel = window.getSelection()!;
		const range = document.createRange();
		range.setStart(text, 1);
		range.collapse(true);
		sel.removeAllRanges();
		sel.addRange(range);

		const fallback = { isTextNode: false, partIndex: 9, offset: 0 };
		expect(normalizeSelection(fallback)).toEqual(fallback);
	});

	it('falls back to the provided value when the selection is anchored at the ARTICLE itself', () => {
		const article = makeArticle('<span>hi</span>');
		const sel = window.getSelection()!;
		const range = document.createRange();
		range.setStart(article, 0);
		range.collapse(true);
		sel.removeAllRanges();
		sel.addRange(range);

		const fallback = { isTextNode: true, partIndex: 5, offset: 1 };
		expect(normalizeSelection(fallback)).toEqual(fallback);
	});
});

describe('setSelection', () => {
	it('no-ops cleanly when partIndex is out of range', async () => {
		const article = makeArticle('<span>hi</span>');
		// Should not throw — the bail-out at the top covers an empty/cleared
		// editable that the renderer hasn't repopulated yet.
		expect(() => setSelection(article, { isTextNode: true, partIndex: 7, offset: 0 })).not.toThrow();
		// Drain the microtask queue so any pending selection mutation runs.
		await Promise.resolve();
	});

	it('places the caret inside the requested text node (text-node selection)', async () => {
		const article = makeArticle('<span>abcdef</span>');
		setSelection(article, { isTextNode: true, partIndex: 0, offset: 4 });
		// setSelection schedules via queueMicrotask — flush the queue.
		await Promise.resolve();

		const sel = window.getSelection()!;
		expect(sel.rangeCount).toBe(1);
		const range = sel.getRangeAt(0);
		expect(range.startContainer.nodeName).toBe('#text');
		expect(range.startOffset).toBe(4);
	});

	it('places the caret after a non-text node (chip) selection', async () => {
		// Renderer shape: <div data-type=…> = chip, <span data-anchor=tail> for caret
		const article = makeArticle('<div data-type="uuid" data-payload="{}"></div><span data-anchor="tail">​</span>');
		setSelection(article, { isTextNode: false, partIndex: 0, offset: 0 });
		await Promise.resolve();

		const sel = window.getSelection()!;
		expect(sel.rangeCount).toBe(1);
	});

	it('clamps an out-of-range offset to the text length instead of throwing', async () => {
		const article = makeArticle('<span>abc</span>');
		// `lastSelectionPosition.offset` can outlive a content shrink (e.g.
		// the user deleted characters between reconcile and re-render). The
		// caret should land at the end, not crash setStart.
		expect(() => setSelection(article, { isTextNode: true, partIndex: 0, offset: 99 })).not.toThrow();
		await Promise.resolve();

		const sel = window.getSelection()!;
		expect(sel.rangeCount).toBe(1);
		expect(sel.getRangeAt(0).startOffset).toBe(3);
	});

	it('does not throw when the non-text target index is past the last child', async () => {
		const article = makeArticle('<div data-type="uuid" data-payload="{}"></div>');
		// finalIndex = partIndex + 1 = 1, but only 1 child exists. Previously
		// `range.setStart(undefined, 0)` threw inside the executor; we now
		// bail cleanly.
		expect(() => setSelection(article, { isTextNode: false, partIndex: 0, offset: 0 })).not.toThrow();
		await Promise.resolve();
	});
});
