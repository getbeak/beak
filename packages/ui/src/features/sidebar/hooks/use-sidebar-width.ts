import { panePreferenceSetPixelSize } from '@beak/ui/store/preferences/actions';
import { useAppSelector } from '@beak/ui/store/redux';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useDispatch } from 'react-redux';

export const SIDEBAR_PANE_KEY = 'sidebar';

const MIN_WIDTH = 220;
const ABSOLUTE_MAX = 640;

/**
 * Smart default for first-time users (and for the double-click reset).
 *
 * 18% of the viewport scales nicely on 13"–27" displays but on a 6K monitor
 * 18% is ~600px which dwarfs the content. Clamp to a 280–360 band so the
 * sidebar always feels right-sized regardless of screen.
 */
export function computeSidebarDefault(viewportWidth: number) {
	if (!Number.isFinite(viewportWidth) || viewportWidth <= 0) return 300;
	const target = Math.round(viewportWidth * 0.18);
	return Math.max(280, Math.min(360, target));
}

function clamp(value: number, min: number, max: number) {
	return Math.max(min, Math.min(max, value));
}

function getViewportWidth() {
	return typeof window === 'undefined' ? 1440 : window.innerWidth;
}

export interface SidebarWidthControl {
	width: number;
	dragging: boolean;
	min: number;
	max: number;
	defaultWidth: number;
	beginDrag: (startWidth: number) => void;
	updateDrag: (next: number) => void;
	commitDrag: () => void;
	cancelDrag: () => void;
	setWidth: (next: number) => void;
	reset: () => void;
}

export function useSidebarWidth(): SidebarWidthControl {
	const dispatch = useDispatch();
	const stored = useAppSelector(s => s.global.preferences.panes.pixelSizes[SIDEBAR_PANE_KEY]);

	const [viewportWidth, setViewportWidth] = useState(getViewportWidth);
	useEffect(() => {
		const onResize = () => setViewportWidth(getViewportWidth());
		window.addEventListener('resize', onResize);
		return () => window.removeEventListener('resize', onResize);
	}, []);

	const defaultWidth = useMemo(() => computeSidebarDefault(viewportWidth), [viewportWidth]);
	const max = useMemo(
		() => Math.max(MIN_WIDTH + 80, Math.min(ABSOLUTE_MAX, Math.floor(viewportWidth * 0.5))),
		[viewportWidth],
	);

	const baseWidth = stored !== undefined ? clamp(stored, MIN_WIDTH, max) : defaultWidth;

	const [dragOverride, setDragOverride] = useState<number | null>(null);

	const beginDrag = useCallback(
		(startWidth: number) => {
			setDragOverride(clamp(startWidth, MIN_WIDTH, max));
		},
		[max],
	);

	const updateDrag = useCallback(
		(next: number) => {
			setDragOverride(clamp(next, MIN_WIDTH, max));
		},
		[max],
	);

	const commitDrag = useCallback(() => {
		setDragOverride(current => {
			if (current !== null) {
				dispatch(panePreferenceSetPixelSize({ key: SIDEBAR_PANE_KEY, size: current }));
			}
			return null;
		});
	}, [dispatch]);

	const cancelDrag = useCallback(() => setDragOverride(null), []);

	const setWidth = useCallback(
		(next: number) => {
			dispatch(panePreferenceSetPixelSize({ key: SIDEBAR_PANE_KEY, size: clamp(next, MIN_WIDTH, max) }));
		},
		[dispatch, max],
	);

	const reset = useCallback(() => {
		dispatch(panePreferenceSetPixelSize({ key: SIDEBAR_PANE_KEY, size: defaultWidth }));
	}, [defaultWidth, dispatch]);

	return {
		width: dragOverride ?? baseWidth,
		dragging: dragOverride !== null,
		min: MIN_WIDTH,
		max,
		defaultWidth,
		beginDrag,
		updateDrag,
		commitDrag,
		cancelDrag,
		setWidth,
		reset,
	};
}
