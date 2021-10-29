export interface NormalizedSelection {
	isTextNode: boolean;
	partIndex: number;
	offset: number;
}

export function normalizeSelection(existing?: NormalizedSelection): NormalizedSelection {
	const sel = window.getSelection();

	if (!sel || sel.rangeCount === 0) {
		return existing ?? {
			isTextNode: false,
			partIndex: 0,
			offset: 0,
		};
	}

	const range = sel!.getRangeAt(0);
	const startPoint = range.commonAncestorContainer;

	if (existing && startPoint.nodeName === 'ARTICLE')
		return existing;

	let subject: Node = startPoint;

	const isTextNode = subject.nodeName === '#text';

	// Move to the parent span if we're selecting a text node
	if (isTextNode)
		subject = subject.parentNode!;

	// Get the index of the child we're inside
	const partIndex = Array.prototype.indexOf.call(subject.parentNode!.children, subject);

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

	if (!node)
		return;

	if (range.startOffset !== range.endOffset)
		return;

	if (selection.isTextNode) {
		range.setStart(node.childNodes[0], selection.offset);
	} else {
		const childrenLength = elem.childNodes.length;
		const finalIndex = childrenLength === 2 && selection.partIndex === 1 ? 1 : selection.partIndex + 1;

		range.setStart(elem.childNodes[finalIndex], 0);
	}

	window.setTimeout(() => {
		sel?.removeAllRanges();
		sel?.addRange(range);
	}, 0);
}

export function trySetSelection(
	elem: HTMLElement | undefined | null,
	selection: NormalizedSelection | undefined | null,
) {
	if (!elem || !selection)
		return;

	try {
		setSelection(elem, selection);
	} catch { /* Acceptable failure here */ }
}
