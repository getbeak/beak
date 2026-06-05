/**
 * Web-only: pop a folder picker, persist the resulting handle to the
 * IndexedDB store the web host reads on boot, then reload the page so
 * the next host module-load mounts that folder as the fs root.
 *
 * Electron doesn't use this — its `Open existing` action goes through
 * the native folder dialog via `ipcProjectService.openProject()`.
 *
 * Persistence schema mirrors `apps-host/web/src/host/fsa-handle-storage.ts`:
 *   db `beak.fsa`, store `handles`, key `current`. Renderer + host live
 *   in the same browser context, so they can share IDB directly without
 *   round-tripping through IPC.
 */

const DB_NAME = 'beak.fsa';
const STORE = 'handles';
const KEY = 'current';

export type PickOutcome =
	| { ok: true }
	| { ok: false; reason: 'unsupported' | 'cancelled' | 'permission_denied' | 'persistence_failed'; detail?: string };

export async function pickAndPersistLocalFolder(): Promise<PickOutcome> {
	const picker = (
		window as unknown as {
			showDirectoryPicker?: (opts?: { mode?: 'read' | 'readwrite' }) => Promise<FileSystemDirectoryHandle>;
		}
	).showDirectoryPicker;
	if (typeof picker !== 'function') {
		return { ok: false, reason: 'unsupported' };
	}

	let handle: FileSystemDirectoryHandle;
	try {
		handle = await picker({ mode: 'readwrite' });
	} catch (err) {
		if (err instanceof DOMException && err.name === 'AbortError') return { ok: false, reason: 'cancelled' };
		return { ok: false, reason: 'cancelled', detail: err instanceof Error ? err.message : String(err) };
	}

	// Permission check / re-request inside the user gesture. The query/request
	// helpers aren't in TS's lib.dom yet (proposal stage), but every browser
	// that ships `showDirectoryPicker` ships these alongside it.
	type PermissionedHandle = FileSystemDirectoryHandle & {
		queryPermission(opts: { mode: 'read' | 'readwrite' }): Promise<PermissionState>;
		requestPermission(opts: { mode: 'read' | 'readwrite' }): Promise<PermissionState>;
	};
	const ph = handle as PermissionedHandle;
	const queryResult = await ph.queryPermission({ mode: 'readwrite' });
	if (queryResult !== 'granted') {
		const reqResult = await ph.requestPermission({ mode: 'readwrite' });
		if (reqResult !== 'granted') return { ok: false, reason: 'permission_denied' };
	}

	try {
		await persistHandle(handle);
	} catch (err) {
		return { ok: false, reason: 'persistence_failed', detail: err instanceof Error ? err.message : String(err) };
	}

	// Reload so the host re-initialises with the new fs root. We deliberately
	// hit the project route's index so the renderer doesn't try to open a
	// project that hasn't been bootstrapped yet — `WebProjectMain` will pick
	// up where we land.
	window.location.assign('/');
	return { ok: true };
}

function persistHandle(handle: FileSystemDirectoryHandle): Promise<void> {
	return new Promise((resolve, reject) => {
		const req = indexedDB.open(DB_NAME, 1);
		req.onupgradeneeded = () => {
			req.result.createObjectStore(STORE);
		};
		req.onerror = () => reject(req.error);
		req.onsuccess = () => {
			const db = req.result;
			const tx = db.transaction(STORE, 'readwrite');
			tx.objectStore(STORE).put(handle, KEY);
			tx.oncomplete = () => {
				db.close();
				resolve();
			};
			tx.onerror = () => reject(tx.error);
		};
	});
}

export function fsaSupported(): boolean {
	return typeof (window as unknown as { showDirectoryPicker?: unknown }).showDirectoryPicker === 'function';
}
