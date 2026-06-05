import { createContext, useCallback, useContext, useMemo, useState } from 'react';

/**
 * Lets tab contents (or anything else with a tab id) flip a tab into the
 * raw Monaco editor and back. The actual state — which tabs are stuck in
 * broken mode, which the user voluntarily raw-edited — lives wherever the
 * provider sits (currently `TabView`), so siblings of the active tab
 * (tab-bar context menus, the request-pane toolbar) can all read/write
 * the same set without prop drilling.
 */
export interface TabPresentationApi {
	enterRawEdit: (tabId: string) => void;
	exitRawEdit: (tabId: string) => void;
	isRawEditing: (tabId: string) => boolean;
	markBrokenSticky: (tabId: string) => void;
	clearBrokenSticky: (tabId: string) => void;
	isBrokenSticky: (tabId: string) => boolean;
}

const noop: TabPresentationApi = {
	enterRawEdit: () => {},
	exitRawEdit: () => {},
	isRawEditing: () => false,
	markBrokenSticky: () => {},
	clearBrokenSticky: () => {},
	isBrokenSticky: () => false,
};

export const TabPresentationContext = createContext<TabPresentationApi>(noop);

export function useTabPresentation(): TabPresentationApi {
	return useContext(TabPresentationContext);
}

/**
 * Returns a stable `TabPresentationApi` plus the raw sets for callers that
 * need to peek (e.g. Router deciding which view to render). Stick this on
 * a high-enough component that both the tab bar and the tab contents are
 * descendants — `TabView` is the natural home.
 */
export function useTabPresentationState() {
	const [rawEditTabs, setRawEditTabs] = useState<ReadonlySet<string>>(() => new Set());
	const [brokenStickyTabs, setBrokenStickyTabs] = useState<ReadonlySet<string>>(() => new Set());

	const enterRawEdit = useCallback((tabId: string) => {
		setRawEditTabs(prev => {
			if (prev.has(tabId)) return prev;
			const next = new Set(prev);
			next.add(tabId);
			return next;
		});
	}, []);
	const exitRawEdit = useCallback((tabId: string) => {
		setRawEditTabs(prev => {
			if (!prev.has(tabId)) return prev;
			const next = new Set(prev);
			next.delete(tabId);
			return next;
		});
	}, []);
	const markBrokenSticky = useCallback((tabId: string) => {
		setBrokenStickyTabs(prev => {
			if (prev.has(tabId)) return prev;
			const next = new Set(prev);
			next.add(tabId);
			return next;
		});
	}, []);
	const clearBrokenSticky = useCallback((tabId: string) => {
		setBrokenStickyTabs(prev => {
			if (!prev.has(tabId)) return prev;
			const next = new Set(prev);
			next.delete(tabId);
			return next;
		});
	}, []);

	const api = useMemo<TabPresentationApi>(
		() => ({
			enterRawEdit,
			exitRawEdit,
			isRawEditing: tabId => rawEditTabs.has(tabId),
			markBrokenSticky,
			clearBrokenSticky,
			isBrokenSticky: tabId => brokenStickyTabs.has(tabId),
		}),
		[rawEditTabs, brokenStickyTabs, enterRawEdit, exitRawEdit, markBrokenSticky, clearBrokenSticky],
	);

	return api;
}
