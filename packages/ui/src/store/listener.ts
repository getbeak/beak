import { BeakError } from '@beak/common/utils/squawk';
import { createListenerMiddleware, type TypedStartListening } from '@reduxjs/toolkit';

import type { ApplicationState } from '.';

/**
 * App-wide listener middleware. Replaces the redux-saga middleware that
 * previously coordinated side effects.
 *
 * Pattern: each former saga becomes a `listenerMiddleware.startListening({
 *   actionCreator: foo,
 *   effect: async (action, listenerApi) => { ... },
 * })` registration. Long-running subscriptions (fs watchers, IPC pubsub) use
 * `listenerApi.fork(...)` or store a cleanup function in module scope.
 *
 * Concrete registrations live in `./effects/*` (one file per domain).
 *
 * Errors thrown by effects are caught here. BeakError instances are logged
 * with their serialised shape (kind + meta + reasons) so console output is
 * actionable. Native errors are wrapped via `BeakError.coerce` so the log
 * format stays consistent.
 */
export const listenerMiddleware = createListenerMiddleware({
	onError: error => {
		const handled = BeakError.coerce(error);
		console.error(`[listener-middleware] ${handled.message}`, handled.serialize());
	},
});

// biome-ignore lint/suspicious/noExplicitAny: TypedStartListening's second type param is unused but required.
export type AppStartListening = TypedStartListening<ApplicationState, any>;

export const startAppListening = listenerMiddleware.startListening as AppStartListening;
