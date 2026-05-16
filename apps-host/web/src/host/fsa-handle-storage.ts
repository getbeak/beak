/**
 * Persist a user-picked `FileSystemDirectoryHandle` (File System Access
 * API) across page reloads. `FileSystemDirectoryHandle` is structured-
 * cloneable, so we can stuff it into IndexedDB and read it back.
 *
 * IDB schema: one row keyed by `'current'` in the `handles` object store
 * of the `beak.fsa` database. Replacing the row replaces the active
 * folder; clearing it returns the host to OPFS on next boot.
 */

const DB_NAME = 'beak.fsa';
const STORE = 'handles';
const KEY = 'current';

function open(): Promise<IDBDatabase> {
	return new Promise((resolve, reject) => {
		const req = indexedDB.open(DB_NAME, 1);
		req.onupgradeneeded = () => {
			req.result.createObjectStore(STORE);
		};
		req.onsuccess = () => resolve(req.result);
		req.onerror = () => reject(req.error);
	});
}

export async function loadHandle(): Promise<FileSystemDirectoryHandle | null> {
	try {
		const db = await open();
		return await new Promise<FileSystemDirectoryHandle | null>((resolve, reject) => {
			const tx = db.transaction(STORE, 'readonly');
			const req = tx.objectStore(STORE).get(KEY);
			req.onsuccess = () => resolve((req.result as FileSystemDirectoryHandle | undefined) ?? null);
			req.onerror = () => reject(req.error);
			tx.oncomplete = () => db.close();
		});
	} catch {
		return null;
	}
}

export async function saveHandle(handle: FileSystemDirectoryHandle): Promise<void> {
	const db = await open();
	await new Promise<void>((resolve, reject) => {
		const tx = db.transaction(STORE, 'readwrite');
		tx.objectStore(STORE).put(handle, KEY);
		tx.oncomplete = () => {
			db.close();
			resolve();
		};
		tx.onerror = () => reject(tx.error);
	});
}

export async function clearHandle(): Promise<void> {
	try {
		const db = await open();
		await new Promise<void>((resolve, reject) => {
			const tx = db.transaction(STORE, 'readwrite');
			tx.objectStore(STORE).delete(KEY);
			tx.oncomplete = () => {
				db.close();
				resolve();
			};
			tx.onerror = () => reject(tx.error);
		});
	} catch {
		/* IDB unavailable — nothing to clear */
	}
}

/**
 * Re-acquire read+write permission on a previously-saved handle. The
 * browser drops permission when the page is closed; without a re-request
 * the next FS operation throws `NotAllowedError`.
 *
 * `requestPermission` MUST be called from a user gesture. The boot path
 * uses `query` (no gesture needed); the welcome screen's pick-folder flow
 * calls `request` because it runs inside a click handler.
 *
 * `queryPermission` / `requestPermission` aren't yet in `lib.dom` (TC39
 * proposal stage), so we cast through a narrowed type.
 */
type PermissionedHandle = FileSystemDirectoryHandle & {
	queryPermission(opts: { mode: 'read' | 'readwrite' }): Promise<PermissionState>;
	requestPermission(opts: { mode: 'read' | 'readwrite' }): Promise<PermissionState>;
};

export async function checkHandlePermission(handle: FileSystemDirectoryHandle): Promise<boolean> {
	const result = await (handle as PermissionedHandle).queryPermission({ mode: 'readwrite' });
	return result === 'granted';
}

export async function requestHandlePermission(handle: FileSystemDirectoryHandle): Promise<boolean> {
	const result = await (handle as PermissionedHandle).requestPermission({ mode: 'readwrite' });
	return result === 'granted';
}
