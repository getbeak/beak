import { panePreferenceSetSplitRatio } from '@beak/ui/store/preferences/actions';
import { useAppSelector } from '@beak/ui/store/redux';
import { useCallback, useMemo } from 'react';
import { useDispatch } from 'react-redux';
import type { HandlerProps } from 'react-reflex';

interface UsePaneSplitArgs {
	key: string;
	defaultRatio: number;
	orientation: 'vertical' | 'horizontal';
	/** Lower / upper bounds for the first pane's fraction. */
	minRatio?: number;
	maxRatio?: number;
}

interface UsePaneSplitResult {
	/** Pass as `flex` on the first ReflexElement (and `1 - firstFlex` on the second). */
	firstFlex: number;
	secondFlex: number;
	/** Attach to the first ReflexElement's `onStopResize`. */
	onStopResize: (event: HandlerProps) => void;
}

/**
 * Persists a two-pane split ratio in `panes.json`. Hydrates the initial
 * flex from the stored value (clamped to [minRatio, maxRatio]), and writes
 * a new ratio on every commit-end.
 *
 * Designed for `react-reflex` containers where the first pane defines the
 * split — attach the returned `onStopResize` to the first ReflexElement.
 */
export function usePaneSplit({
	key,
	defaultRatio,
	orientation,
	minRatio = 0.1,
	maxRatio = 0.9,
}: UsePaneSplitArgs): UsePaneSplitResult {
	const dispatch = useDispatch();
	const stored = useAppSelector(s => s.global.preferences.panes.splitRatios[key]);

	const ratio = useMemo(() => {
		if (stored === undefined || !Number.isFinite(stored)) return defaultRatio;
		return Math.max(minRatio, Math.min(maxRatio, stored));
	}, [defaultRatio, maxRatio, minRatio, stored]);

	const onStopResize = useCallback(
		(event: HandlerProps) => {
			const node = event.domElement;
			if (!(node instanceof HTMLElement)) return;
			const ownRect = node.getBoundingClientRect();
			const ownSize = orientation === 'vertical' ? ownRect.width : ownRect.height;

			const container = node.parentElement;
			if (!container) return;
			const containerRect = container.getBoundingClientRect();
			const containerSize = orientation === 'vertical' ? containerRect.width : containerRect.height;
			if (containerSize <= 0) return;

			const next = ownSize / containerSize;
			if (!Number.isFinite(next)) return;
			dispatch(panePreferenceSetSplitRatio({ key, ratio: Math.max(minRatio, Math.min(maxRatio, next)) }));
		},
		[dispatch, key, maxRatio, minRatio, orientation],
	);

	return { firstFlex: ratio, secondFlex: 1 - ratio, onStopResize };
}
