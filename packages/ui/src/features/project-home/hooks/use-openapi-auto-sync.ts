import { alertInsert, alertRemove } from '@beak/ui/store/project/actions';
import { endpointSyncFailedIdent } from '@beak/ui/store/project/types';
import { useAppSelector } from '@beak/ui/store/redux';
import path from 'path-browserify';
import { useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';

import { enumerateOpenApiSources } from '../lib/enumerate-sources';
import { syncFromUrl } from '../lib/sync-from-url';

const MIN_INTERVAL_MS = 60_000; // hard floor in ms even if a collection asks for less
const DEFAULT_INTERVAL_MINUTES = 60;

interface RowTimer {
	timer: ReturnType<typeof setTimeout>;
	folderPath: string;
}

/**
 * Walks the project tree periodically and re-syncs any OpenAPI collection
 * that has `autoSync: true` set in its `_collection.json`. Each collection
 * gets its own timer so a slow URL can't delay other syncs.
 *
 * Scheduling rule: next run is `lastSyncedAt + intervalMinutes - now`,
 * clamped to a 60s minimum so a clock-skew or a stale timestamp can't make
 * us hammer an endpoint. After each sync we re-enumerate to pick up any
 * autoSync flips or interval changes.
 *
 * Intentionally simple: no jitter, no retry/backoff. If a URL is flaky the
 * next scheduled tick handles it. If users find that insufficient we'll
 * layer on retry — the loop is small enough to swap in place.
 */
export function useOpenApiAutoSync(enabled: boolean): void {
	const dispatch = useDispatch();
	const tree = useAppSelector(s => s.global.project.tree);
	const projectFolderPath = useAppSelector(s => s.global.project.folderPath) ?? '';
	const timersRef = useRef<RowTimer[]>([]);
	const cancelledRef = useRef(false);

	useEffect(() => {
		if (!enabled) return;
		cancelledRef.current = false;

		void schedule();

		return () => {
			cancelledRef.current = true;
			clearAll();
		};

		async function schedule() {
			clearAll();
			const entries = await enumerateOpenApiSources(tree, projectFolderPath);
			if (cancelledRef.current) return;

			for (const entry of entries) {
				if (!entry.source.autoSync || !entry.source.specUrl) continue;
				const intervalMs = Math.max(MIN_INTERVAL_MS, (entry.source.intervalMinutes ?? DEFAULT_INTERVAL_MINUTES) * 60_000);
				const lastMs = entry.source.lastSyncedAt ? new Date(entry.source.lastSyncedAt).getTime() : 0;
				const due = Math.max(MIN_INTERVAL_MS / 10, lastMs + intervalMs - Date.now());
				const folderPath = entry.folderPath;
				const url = entry.source.specUrl;
				const relativeFolder = entry.relativeFolder;
				const autoSync = entry.source.autoSync;
				const intervalMinutes = entry.source.intervalMinutes;
				const timer = setTimeout(() => {
					if (cancelledRef.current) return;
					void runSync({
						folderPath,
						relativeFolder,
						url,
						autoSync,
						intervalMinutes,
					});
				}, due);
				timersRef.current.push({ timer, folderPath });
			}
		}

		async function runSync(args: {
			folderPath: string;
			relativeFolder: string;
			url: string;
			autoSync?: boolean;
			intervalMinutes?: number;
		}) {
			const ident = endpointSyncFailedIdent(args.folderPath);
			const folderName = path.basename(args.folderPath) || args.relativeFolder;
			try {
				const outcome = await syncFromUrl({
					targetFolder: args.relativeFolder,
					url: args.url,
					autoSync: args.autoSync,
					intervalMinutes: args.intervalMinutes,
				});
				if (outcome.ok) {
					// A clean sync clears any prior failure for this folder so
					// the badge disappears without waiting for the user to act.
					dispatch(alertRemove(ident));
				} else {
					dispatch(
						alertInsert({
							ident,
							alert: {
								type: 'endpoint_sync_failed',
								severity: 'warning',
								scope: { kind: 'endpoint', folderPath: args.folderPath },
								payload: {
									folderName,
									kind: 'openapi',
									errorMessage: outcome.error,
								},
							},
						}),
					);
				}
			} catch (err) {
				// `syncFromUrl` is meant to capture its own failures into the
				// outcome union — but a thrown is still possible (e.g. an IPC
				// layer crash). Surface it the same way so users see *something*.
				console.warn('OpenAPI auto-sync threw', args.url, err);
				const message = err instanceof Error ? err.message : String(err);
				dispatch(
					alertInsert({
						ident,
						alert: {
							type: 'endpoint_sync_failed',
							severity: 'warning',
							scope: { kind: 'endpoint', folderPath: args.folderPath },
							payload: {
								folderName,
								kind: 'openapi',
								errorMessage: message,
							},
						},
					}),
				);
			}
			if (cancelledRef.current) return;
			// Re-enumerate after each run so config changes are picked up.
			void schedule();
		}

		function clearAll() {
			for (const t of timersRef.current) clearTimeout(t.timer);
			timersRef.current = [];
		}
	}, [enabled, tree, projectFolderPath]);
}
