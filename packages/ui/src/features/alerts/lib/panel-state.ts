import type { AlertSeverity } from '@beak/ui/store/project/types';
import { useSyncExternalStore } from 'react';

/**
 * Tiny module-scoped store for the Problems panel's open state. Sits
 * outside Redux because the panel is purely view state — no other slice
 * needs to react to it, and persisting it through SSR/devtools would just
 * be noise. `useSyncExternalStore` keeps it React-safe.
 *
 * Multiple components trigger it (status-strip pills, inline banner
 * "view all" link, future toast). Routing them through a shared store
 * means the strip and the banner stay in sync without prop-drilling.
 */

interface PanelState {
	open: boolean;
	/** When set, the panel opens filtered to this severity bucket. */
	filterSeverity: AlertSeverity | null;
}

let state: PanelState = { open: false, filterSeverity: null };
const listeners = new Set<() => void>();

function emit() {
	for (const l of listeners) l();
}

export function openAlertsPanel(filterSeverity: AlertSeverity | null = null) {
	state = { open: true, filterSeverity };
	emit();
}

export function closeAlertsPanel() {
	if (!state.open) return;
	state = { open: false, filterSeverity: null };
	emit();
}

function subscribe(l: () => void) {
	listeners.add(l);
	return () => {
		listeners.delete(l);
	};
}

const getSnapshot = () => state;

export function useAlertsPanelState(): PanelState {
	return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
