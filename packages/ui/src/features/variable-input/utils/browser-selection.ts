export interface NormalizedSelection {
	isTextNode: boolean;
	partIndex: number;
	offset: number;
}

export function normalizeSelection(existing?: NormalizedSelection): NormalizedSelection {
	const sel = window.getSelection();

	if (!sel || sel.rangeCount === 0) {
		return (
			existing ?? {
				isTextNode: false,
				partIndex: 0,
				offset: 0,
			}
		);
	}

	const range = sel!.getRangeAt(0);
	const startPoint = range.commonAncestorContainer;

	if (existing && startPoint.nodeName === 'ARTICLE') return existing;

	let subject: Node = startPoint;
	let container: Node | null = startPoint;
	const isTextNode = subject.nodeName === '#text';

	if (isTextNode) {
		// Try to move to the parent span if we're selecting a text node
		if (subject.parentNode?.nodeName === 'SPAN') subject = subject.parentNode;

		// Walk up until we hit the ARTICLE wrapper. If we walk off the top
		// (selection lives outside our editable — happens after blur with a
		// stray range), bail and let the caller fall back. The previous code
		// dereferenced `null.parentNode` and crashed; we'd rather hand back
		// the existing snapshot.
		while (container && container.nodeName !== 'ARTICLE') {
			container = container.parentNode;
		}

		if (!container) {
			return (
				existing ?? {
					isTextNode: false,
					partIndex: 0,
					offset: 0,
				}
			);
		}
	}

	// Get the index of the child we're inside
	const partIndex = Array.prototype.indexOf.call(container!.childNodes, subject);

	const out = {
		isTextNode,
		partIndex,
		offset: range.startOffset,
	};

	return out;
}

export function setSelection(elem: HTMLElement, selection: NormalizedSelection) {
	const sel = window.getSelection();
	const range = document.createRange();
	const node = elem.childNodes[selection.partIndex];

	if (!node) return;

	if (selection.isTextNode) {
		const textNode = node.childNodes[0];
		if (!textNode) return;
		range.setStart(textNode, Math.min(selection.offset, textNode.nodeValue?.length ?? 0));
	} else {
		const childrenLength = elem.childNodes.length;
		const finalIndex = childrenLength === 2 && selection.partIndex === 1 ? 1 : selection.partIndex + 1;
		const target = elem.childNodes[finalIndex];
		if (!target) return;
		range.setStart(target, 0);
	}

	// Defer to a microtask so that any in-flight `innerHTML` mutation has flushed
	// before we anchor the selection. The previous `new Promise(() => …)` ran the
	// body synchronously inside the executor but never resolved the promise —
	// misleading and timing-fragile. A microtask is the actual "after this stack
	// unwinds" boundary we want.
	queueMicrotask(() => {
		sel?.removeAllRanges();
		sel?.addRange(range);
	});
}

export function trySetSelection(
	elem: HTMLElement | undefined | null,
	selection: NormalizedSelection | undefined | null,
) {
	if (!elem || !selection) return;

	try {
		setSelection(elem, selection);
	} catch {
		/* Acceptable failure here */
	}
}
