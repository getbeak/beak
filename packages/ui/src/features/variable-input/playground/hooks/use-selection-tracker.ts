import { useEffect, useState } from 'react';

import { normalizeSelection } from '../../utils/browser-selection';

export interface SelectionSnapshot {
	exists: boolean;
	collapsed: boolean;
	anchorNodeName: string;
	anchorOffset: number;
	focusNodeName: string;
	focusOffset: number;
	rangeText: string;
	partIndex?: number;
	isTextNode?: boolean;
	offset?: number;
}

const empty: SelectionSnapshot = {
	exists: false,
	collapsed: true,
	anchorNodeName: '—',
	anchorOffset: 0,
	focusNodeName: '—',
	focusOffset: 0,
	rangeText: '',
};

/**
 * Polls `window.getSelection()` while the tracked element holds focus, plus a
 * `selectionchange` listener for the moments outside of focus (clicking onto
 * a child blob, etc.). The polling backstop covers Chromium quirks where
 * `selectionchange` fires before the range has stabilised inside a
 * contenteditable subtree.
 */
export function useSelectionTracker(elemRef: React.RefObject<HTMLElement | null>): SelectionSnapshot {
	const [snapshot, setSnapshot] = useState<SelectionSnapshot>(empty);

	useEffect(() => {
		const tick = () => {
			const elem = elemRef.current;
			if (!elem) return setSnapshot(empty);

			const sel = window.getSelection();
			if (!sel || sel.rangeCount === 0) return setSnapshot(empty);

			// Only report selections anchored inside our element — otherwise
			// the panel flickers with random selections elsewhere on the page.
			if (!elem.contains(sel.anchorNode)) return setSnapshot(empty);

			const range = sel.getRangeAt(0);
			let normalized: ReturnType<typeof normalizeSelection> | undefined;
			try {
				normalized = normalizeSelection();
			} catch {
				/* swallow — normalization expects an ARTICLE root */
			}

			setSnapshot({
				exists: true,
				collapsed: sel.isCollapsed,
				anchorNodeName: nodeName(sel.anchorNode),
				anchorOffset: sel.anchorOffset,
				focusNodeName: nodeName(sel.focusNode),
				focusOffset: sel.focusOffset,
				rangeText: range.toString(),
				partIndex: normalized?.partIndex,
				isTextNode: normalized?.isTextNode,
				offset: normalized?.offset,
			});
		};

		document.addEventListener('selectionchange', tick);
		const interval = window.setInterval(tick, 200);
		tick();

		return () => {
			document.removeEventListener('selectionchange', tick);
			window.clearInterval(interval);
		};
	}, [elemRef]);

	return snapshot;
}

function nodeName(n: Node | null): string {
	if (!n) return '—';
	if (n.nodeName === '#text') return `#text(${JSON.stringify((n.textContent ?? '').slice(0, 18))})`;
	const elem = n as HTMLElement;
	if (elem.dataset?.type) return `${n.nodeName}[data-type=${elem.dataset.type}]`;
	if (elem.dataset?.anchor) return `${n.nodeName}[data-anchor=${elem.dataset.anchor}]`;
	return n.nodeName;
}
