export interface NormalizedSelection {
	isTextNode: boolean;
	partIndex: number;
	offset: number;
}

export function normalizeSelection(): NormalizedSelection {
	const sel = window.getSelection();
	const range = sel!.getRangeAt(0);
	const startPoint = range.commonAncestorContainer;

	let subject: Node = startPoint;

	const isTextNode = subject.nodeName === '#text';

	// Move to the parent span if we're selecting a text node
	if (isTextNode)
		subject = subject.parentNode!;

	// Get the index of the child we're inside
	const partIndex = Array.prototype.indexOf.call(subject.parentNode!.children, subject);

	return {
		isTextNode,
		partIndex,
		offset: range.startOffset,
	};
}

export function setSelection(elem: HTMLElement, selection: NormalizedSelection) {
	const sel = window.getSelection();
	const range = document.createRange();
	const node = elem.childNodes[selection.partIndex];

	if (!node)
		return;

	if (selection.isTextNode)
		range.setStart(node.childNodes[0], selection.offset);
	else
		range.setStart(node, selection.offset);

	sel?.removeAllRanges();
	sel?.addRange(range);
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
