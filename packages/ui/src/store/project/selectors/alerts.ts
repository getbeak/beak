import type { ApplicationState } from '@beak/ui/store';
import { createSelector } from '@reduxjs/toolkit';

import type { Alert, AlertSeverity } from '../types';

type RootState = ApplicationState;

/**
 * Selectors over the project alerts map. The map is keyed by ident — these
 * helpers shape it into the structures the unified alert surfaces (bottom
 * status strip, row flair, inline banner, Problems panel) actually need.
 *
 * Memoised so the row-flair selectors don't churn refs every render. The
 * input is just the alerts map, so memoisation is one-deep and cheap.
 */

const selectAlertsMap = (state: RootState) => state.global.project.alerts;

/** All live (non-undefined) alerts as a flat array. Stable identity per map. */
export const selectAllAlerts = createSelector(selectAlertsMap, map => {
	const out: Alert[] = [];
	for (const ident in map) {
		const a = map[ident];
		if (a) out.push(a);
	}
	return out;
});

/** Aggregate counts per severity. Drives the bottom status-strip badges. */
export const selectAlertCounts = createSelector(selectAllAlerts, alerts => {
	const counts: Record<AlertSeverity, number> & { total: number } = {
		error: 0,
		warning: 0,
		notice: 0,
		total: 0,
	};
	for (const a of alerts) {
		counts[a.severity] += 1;
		counts.total += 1;
	}
	return counts;
});

/**
 * Highest severity present, or null if the alerts list is empty. `error`
 * outranks `warning` outranks `notice`. Used by the row/tab flair to pick
 * the dot colour when multiple alerts target the same scope.
 */
export function selectMaxSeverity(alerts: Alert[]): AlertSeverity | null {
	let max: AlertSeverity | null = null;
	for (const a of alerts) {
		if (a.severity === 'error') return 'error';
		if (a.severity === 'warning') max = 'warning';
		else if (max === null) max = 'notice';
	}
	return max;
}

/**
 * Hook-friendly factory: returns a memoised selector that filters alerts
 * scoped to a given requestId. The closure is stable per requestId so
 * `useSelector(makeSelectAlertsForRequest(id))` doesn't re-create on every
 * render of the calling component when paired with `useMemo`.
 */
export function makeSelectAlertsForRequest(requestId: string) {
	return createSelector(selectAllAlerts, alerts =>
		alerts.filter(a => a.scope.kind === 'request' && a.scope.requestId === requestId),
	);
}

/** Same shape for endpoint-scoped alerts (Endpoints sidebar rows). */
export function makeSelectAlertsForEndpoint(folderPath: string) {
	return createSelector(selectAllAlerts, alerts =>
		alerts.filter(a => a.scope.kind === 'endpoint' && a.scope.folderPath === folderPath),
	);
}

/** Project-scoped alerts (missing encryption, invalid extension, …). */
export const selectProjectScopeAlerts = createSelector(selectAllAlerts, alerts =>
	alerts.filter(a => a.scope.kind === 'project'),
);
