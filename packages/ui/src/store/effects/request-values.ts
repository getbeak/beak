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
	splitRequestIntoSchemaAndValues,
	toggleScalarEnabled,
} from '@beak/state/request-values';
import { type ProjectRequestValues, projectValuesFileSchema } from '@beak/state/schemas';
import { ipcValuesService } from '@beak/ui/lib/ipc';
import type { ApplicationState } from '@beak/ui/store';
import type { Tree, ValidRequestNode } from '@getbeak/types/nodes';

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

function isValidRequest(node: Tree[string]): node is ValidRequestNode {
	return node?.type === 'request' && 'info' in node && Boolean((node as ValidRequestNode).info);
}

/**
 * Backfill values for any request in the tree that doesn't yet have an
 * entry in the loaded values doc. New projects (no `.beak/values.json`)
 * land in this branch with an empty `loaded` map; pre-existing projects
 * land with their saved values + any new requests added since the last
 * save. Either way we end up with values for every request before the UI
 * starts rendering.
 */
function backfillFromTree(tree: Tree, loaded: ProjectRequestValues): ProjectRequestValues {
	const next: ProjectRequestValues = { ...loaded };
	for (const node of Object.values(tree)) {
		if (!isValidRequest(node)) continue;
		if (next[node.id]) continue;
		const { values } = splitRequestIntoSchemaAndValues(node.info);
		next[node.id] = values;
	}
	return next;
}

export function registerRequestValuesEffects(start: AppStartListening) {
	start({
		actionCreator: projectOpened,
		effect: async (action, api) => {
			let loaded: ProjectRequestValues = {};

			try {
				const { values } = await ipcValuesService.load();
				if (values !== null) {
					const parsed = projectValuesFileSchema.safeParse(values);
					if (parsed.success) {
						loaded = parsed.data.requests as unknown as ProjectRequestValues;
					} else {
						console.warn('values.json failed schema validation, ignoring', parsed.error);
					}
				}
			} catch (error) {
				console.warn('values.json load failed', error);
			}

			const seeded = backfillFromTree(action.payload.tree, loaded);
			api.dispatch(hydrateRequestValues({ requests: seeded }));
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
