import {
	clearAllCookies,
	clearJar,
	clearJarItem,
	deleteCookie,
	renameJar,
	upsertCookie,
	upsertCookies,
} from '@beak/state/cookies';
import { completeFlight } from '@beak/state/flight';
import { projectOpened } from '@beak/state/project';
import type { ApplicationState } from '@beak/ui/store';

import { captureSetCookies, loadAndHydrateCookies, persistCookieJars } from '../../services/cookies';

import type { AppStartListening } from '../listener';

const SAVE_DEBOUNCE_MS = 600;

let saveTimer: ReturnType<typeof setTimeout> | null = null;

function scheduleSave(getState: () => ApplicationState) {
	if (saveTimer) clearTimeout(saveTimer);
	saveTimer = setTimeout(() => {
		saveTimer = null;
		void persistCookieJars(getState);
	}, SAVE_DEBOUNCE_MS);
}

export function registerCookieEffects(start: AppStartListening) {
	start({
		actionCreator: projectOpened,
		effect: async (_action, api) => {
			await loadAndHydrateCookies(api.dispatch);
		},
	});

	const mutators = [upsertCookie, upsertCookies, deleteCookie, clearJarItem, clearJar, clearAllCookies, renameJar];
	for (const actionCreator of mutators) {
		start({
			actionCreator,
			effect: (_action, api) => {
				scheduleSave(api.getState as () => ApplicationState);
			},
		});
	}

	// Capture Set-Cookie from completed responses. Runs after the slice has
	// finalised the flight entry into history, so we can read the resolved
	// URL straight off `response.url`.
	start({
		actionCreator: completeFlight,
		effect: (action, api) => {
			const state = api.getState() as ApplicationState;
			const captured = captureSetCookies(state, action.payload.response);
			for (const target of captured) {
				api.dispatch(
					upsertCookies({
						variableSet: target.variableSet,
						itemId: target.itemId,
						cookies: target.cookies,
					}),
				);
			}
		},
	});
}
