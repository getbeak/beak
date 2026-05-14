import { projectOpened } from '@beak/state/project';
import {
	clearBodyPropertyValue,
	clearScalarValue,
	hydrateRequestValues,
	removeRequestValues,
	replaceRequestValues,
	setBodyPropertyValue,
	setBodyValue,
	setScalarValue,
	toggleScalarEnabled,
} from '@beak/state/request-values';
import { emptyProjectValuesFile, projectValuesFileSchema } from '@beak/state/schemas';
import type { ApplicationState } from '@beak/ui/store';
import { ipcValuesService } from '@beak/ui/lib/ipc';

import type { AppStartListening } from '../listener';

/**
 * Hydration + persistence for `.beak/values.json`.
 *
 * - On `projectOpened` we load the file (or fall back to an empty doc when
 *   the file is missing/corrupt) and dispatch `hydrateRequestValues` to
 *   seed the slice.
 * - On any mutating values action we debounce a save back to disk. Because
 *   the listener middleware doesn't have built-in debounce we keep a
 *   timeout reference per project and reset it on every mutation.
 */

const SAVE_DEBOUNCE_MS = 400;

let saveTimer: ReturnType<typeof setTimeout> | null = null;

function scheduleSave(getState: () => ApplicationState) {
	if (saveTimer) clearTimeout(saveTimer);
	saveTimer = setTimeout(() => {
		saveTimer = null;
		const state = getState();
		const slice = state.global.requestValues;
		if (!slice.loaded) return;
		void ipcValuesService.save({
			values: { version: 1, requests: slice.requests },
		});
	}, SAVE_DEBOUNCE_MS);
}

export function registerRequestValuesEffects(start: AppStartListening) {
	start({
		actionCreator: projectOpened,
		effect: async (_action, api) => {
			try {
				const { values } = await ipcValuesService.load();
				if (values === null) {
					api.dispatch(hydrateRequestValues({ requests: emptyProjectValuesFile().requests }));
					return;
				}

				const parsed = projectValuesFileSchema.safeParse(values);
				if (!parsed.success) {
					// On a corrupt file fall back to an empty hydrate so the renderer
					// keeps working; the next save will overwrite the bad doc.
					console.warn('values.json failed schema validation, ignoring', parsed.error);
					api.dispatch(hydrateRequestValues({ requests: {} }));
					return;
				}

				api.dispatch(hydrateRequestValues({ requests: parsed.data.requests }));
			} catch (error) {
				console.warn('values.json load failed', error);
				api.dispatch(hydrateRequestValues({ requests: {} }));
			}
		},
	});

	const mutatingActions = [
		replaceRequestValues,
		removeRequestValues,
		setScalarValue,
		clearScalarValue,
		toggleScalarEnabled,
		setBodyValue,
		setBodyPropertyValue,
		clearBodyPropertyValue,
	];

	for (const actionCreator of mutatingActions) {
		start({
			actionCreator,
			effect: (_action, api) => {
				scheduleSave(api.getState as () => ApplicationState);
			},
		});
	}
}
