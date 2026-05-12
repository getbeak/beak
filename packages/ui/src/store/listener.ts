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
 */
export const listenerMiddleware = createListenerMiddleware({
	onError: error => {
		// eslint-disable-next-line no-console
		console.error('[listener-middleware]', error);
	},
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AppStartListening = TypedStartListening<ApplicationState, any>;

export const startAppListening = listenerMiddleware.startListening as AppStartListening;
