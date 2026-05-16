import { completeFlight, flightFailure, hydrateFlightHistories } from '@beak/state/flight';
import { applyHistoryRules, compressEntry, persistedToRuntimeHistory } from '@beak/state/flight/history-rules';
import { projectOpened } from '@beak/state/project';
import {
	emptyFlightHistoryFile,
	flightHistoryFileSchema,
	type PersistedFlightEntry,
} from '@beak/state/schemas';
import binaryStore from '@beak/ui/lib/binary-store';
import { ipcFsService } from '@beak/ui/lib/ipc';
import type { ApplicationState } from '@beak/ui/store';
import path from 'path-browserify';

import type { AppStartListening } from '../listener';

const HISTORY_FILE_PATH = path.join('.beak', 'flight-history.json');
const SAVE_DEBOUNCE_MS = 800;

let saveTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * Renderer-side persistence + hydration of `.beak/flight-history.json`.
 *
 * On `projectOpened`: read the file, validate with Zod, hydrate the slice.
 * Malformed / missing → start with an empty in-memory map.
 *
 * On any flight-completion event (success or failure): debounce-save the
 * full current history map. Compression + rules (auth redaction, body
 * truncation, per-request + project caps) happen at write time so the
 * runtime stays unconstrained.
 */
function scheduleSave(getState: () => ApplicationState) {
	if (saveTimer) clearTimeout(saveTimer);
	saveTimer = setTimeout(() => {
		saveTimer = null;
		void persistNow(getState);
	}, SAVE_DEBOUNCE_MS);
}

async function persistNow(getState: () => ApplicationState) {
	const state = getState();
	const runtime = state.global.flight.flightHistories;

	const histories: Record<string, ReturnType<typeof buildPersistedHistory>> = {};
	for (const [requestId, history] of Object.entries(runtime)) {
		histories[requestId] = buildPersistedHistory(requestId, history);
	}

	// The Zod-inferred persisted history type carries `passthrough()` index
	// signatures that don't structurally line up with the runtime
	// `FlightHistoryMetadata` interface. The runtime metadata is a strict
	// subset of the persisted shape — casting across this boundary is the
	// pragmatic way to keep both type systems happy without leaking
	// index-signature noise into the runtime types.
	const file = applyHistoryRules({ version: 1, histories: histories as never });

	try {
		await ipcFsService.writeJson(HISTORY_FILE_PATH, file, { spaces: '\t' });
	} catch (error) {
		console.warn('flight-history persist failed', error);
	}
}

function buildPersistedHistory(
	_requestId: string,
	history: ApplicationState['global']['flight']['flightHistories'][string],
) {
	const entries: PersistedFlightEntry[] = [];
	for (const entry of Object.values(history.history)) {
		const requestBytes = entry.binaryStoreKey
			? binaryStore.exists(`${entry.binaryStoreKey}-req`)
				? binaryStore.get(`${entry.binaryStoreKey}-req`)
				: undefined
			: undefined;
		const responseBytes = entry.binaryStoreKey && binaryStore.exists(entry.binaryStoreKey)
			? binaryStore.get(entry.binaryStoreKey)
			: undefined;
		entries.push(compressEntry(entry, { request: requestBytes, response: responseBytes }));
	}
	return {
		selected: history.selected,
		entries,
		metadata: history.metadata,
	};
}

export function registerFlightHistoryEffects(start: AppStartListening) {
	start({
		actionCreator: projectOpened,
		effect: async (_action, api) => {
			try {
				// First-open projects have no history file yet — short-circuit
				// before the read so the main process doesn't log a benign
				// ENOENT through its IPC error channel.
				if (!(await ipcFsService.pathExists(HISTORY_FILE_PATH))) {
					api.dispatch(hydrateFlightHistories({ histories: {} }));
					return;
				}
				const raw = (await ipcFsService.readJson<unknown>(HISTORY_FILE_PATH)) as unknown;
				if (!raw || (typeof raw === 'string' && raw.length === 0)) {
					api.dispatch(hydrateFlightHistories({ histories: {} }));
					return;
				}
				const parsed = flightHistoryFileSchema.safeParse(raw);
				if (!parsed.success) {
					console.warn('.beak/flight-history.json failed schema validation, ignoring', parsed.error);
					api.dispatch(hydrateFlightHistories({ histories: {} }));
					return;
				}
				// Apply rules even on hydrate — handles the case where the file was
				// edited by hand and now exceeds caps.
				const cleaned = applyHistoryRules(parsed.data);
				const histories: Record<string, ReturnType<typeof persistedToRuntimeHistory>> = {};
				for (const [requestId, persisted] of Object.entries(cleaned.histories)) {
					histories[requestId] = persistedToRuntimeHistory(persisted);
					// Seed the binary store with whatever response/request bodies
					// were captured on disk. The OverviewTab / ResponseTab / body
					// hooks all read bytes through `binaryStore.get(binaryStoreKey)`
					// — without this seeding, a refresh leaves them empty even
					// though the persisted JSON has the preview text.
					for (const entry of persisted.entries) {
						const key = `${entry.flightId}-hydrated`;
						if (entry.response?.body !== undefined) {
							binaryStore.create(key, new TextEncoder().encode(entry.response.body));
						} else if (entry.response?.hasBody) {
							// We knew there was a body but it was dropped (binary /
							// oversized). Create an empty slot so the inspector
							// can still render the "body truncated" hint without
							// throwing on a missing key.
							binaryStore.create(key);
						}
						if (entry.request.body !== undefined) {
							binaryStore.create(`${key}-req`, new TextEncoder().encode(entry.request.body));
						}
					}
				}
				api.dispatch(hydrateFlightHistories({ histories }));
			} catch (error) {
				// File missing is fine — first project open, no history yet.
				if ((error as { code?: string })?.code !== 'ENOENT') {
					console.warn('flight-history hydrate failed', error);
				}
				api.dispatch(
					hydrateFlightHistories({ histories: emptyFlightHistoryFile().histories as never }),
				);
			}
		},
	});

	// Any flight-completion event triggers a debounced save. Both completeFlight
	// (successful) and flightFailure (errored) finalise an entry on the
	// history.
	const triggers = [completeFlight, flightFailure];
	for (const actionCreator of triggers) {
		start({
			actionCreator,
			effect: (_action, api) => {
				scheduleSave(api.getState as () => ApplicationState);
			},
		});
	}
}
