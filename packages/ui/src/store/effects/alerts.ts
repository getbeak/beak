import { beginFlightRequest, completeFlight, flightFailure } from '@beak/state/flight';
import { pushToast } from '@beak/ui/features/alerts/lib/toast-queue';
import { alertInsert, alertRemove } from '@beak/ui/store/project/actions';
import { type Alert, flightFailedIdent } from '@beak/ui/store/project/types';

import type { AppStartListening } from '../listener';

/**
 * Toast a brief notification when a new error-severity alert lands. The
 * persistent surfaces (status strip, sidebar flair, inline banner) all
 * stay subscribed to the slice as the source of truth — the toast is just
 * the "this thing JUST happened" cue so the user notices it instead of
 * having to glance at the strip.
 *
 * Warnings and notices intentionally don't toast: they're surfaced calmly
 * through the strip + row flair, and a popup for each "GET with body"
 * misconfig would be more annoying than helpful.
 */
export function registerAlertsEffects(startListening: AppStartListening) {
	startListening({
		actionCreator: alertInsert,
		effect: async ({ payload }) => {
			if (payload.alert.severity !== 'error') return;
			const summary = summariseAlert(payload.alert);
			pushToast({
				severity: payload.alert.severity,
				title: summary.title,
				description: summary.description,
			});
		},
	});

	// Bridge flight slice → alerts slice. The response pane already shows the
	// raw error; the alert is what lights up the sidebar/tab/strip so the
	// failure is unmissable across the app, not just on the open response.
	startListening({
		actionCreator: flightFailure,
		effect: async ({ payload }, api) => {
			const requestId = payload.requestId;
			const errorMessage = extractErrorMessage(payload.error);
			api.dispatch(
				alertInsert({
					ident: flightFailedIdent(requestId),
					alert: {
						type: 'flight_failed',
						severity: 'error',
						scope: { kind: 'request', requestId },
						payload: {
							errorMessage,
							flightId: payload.flightId,
						},
					},
				}),
			);
		},
	});

	// Successful (re-)flight retires the failure alert. We don't want a red
	// dot lingering on a request the user has since fixed.
	startListening({
		actionCreator: completeFlight,
		effect: async ({ payload }, api) => {
			api.dispatch(alertRemove(flightFailedIdent(payload.requestId)));
		},
	});

	// Starting a new flight optimistically clears the previous failure so the
	// user gets a clean slate while it's running. If it fails again, the new
	// `flightFailure` will re-insert.
	startListening({
		actionCreator: beginFlightRequest,
		effect: async ({ payload }, api) => {
			api.dispatch(alertRemove(flightFailedIdent(payload.requestId)));
		},
	});
}

function extractErrorMessage(err: unknown): string {
	if (!err) return 'Flight failed';
	if (typeof err === 'string') return err;
	if (err instanceof Error) return err.message || 'Flight failed';
	if (typeof err === 'object' && err && 'message' in err) {
		const m = (err as { message?: unknown }).message;
		if (typeof m === 'string') return m || 'Flight failed';
	}
	return 'Flight failed';
}

function summariseAlert(alert: Alert): { title: string; description: string } {
	switch (alert.type) {
		case 'missing_encryption':
			return {
				title: 'Project encryption key missing',
				description: 'Some secrets in this project can’t be decrypted. Click to fix.',
			};
		case 'invalid_extension':
			return {
				title: `Extension “${alert.payload.assumedName}” failed to load`,
				description: 'Open the Problems panel to view the error log.',
			};
		case 'http_body_not_allowed':
			return {
				title: 'HTTP verb doesn’t allow a body',
				description: 'GET, HEAD, and OPTIONS requests can’t send a body.',
			};
		case 'endpoint_sync_failed':
			return {
				title: `Sync failed — ${alert.payload.folderName}`,
				description: alert.payload.errorMessage,
			};
		case 'flight_failed':
			return {
				title: 'Flight failed',
				description: alert.payload.errorMessage,
			};
	}
}
