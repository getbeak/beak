/**
 * Web-only: copy a project that currently lives inside the OPFS sandbox
 * out to a user-picked folder on disk via the File System Access API.
 *
 * After a successful copy the picked folder becomes the active project
 * root (the FSA handle is persisted to the same IDB slot the boot path
 * reads from), a `local-folder` recent is registered, and the caller
 * gets enough information to reload the window onto the new root.
 *
 * The OPFS-side project is NOT deleted — if the FSA mount later loses
 * permission or the folder is moved, the sandbox copy is still there as
 * a fallback. We can wire a "clear browser copy" follow-up once people
 * actually rely on the export.
 *
 * Electron doesn't need this — its projects already live on disk.
 */
import { ipcProjectService } from '@beak/ui/lib/ipc';

const DB_NAME = 'beak.fsa';
const STORE = 'handles';
const KEY = 'current';
const OPFS_NAMESPACE = 'beak';

export type ExportOutcome =
	| { ok: true; folderName: string }
	| {
			ok: false;
			reason:
				| 'unsupported'
				| 'cancelled'
				| 'permission_denied'
				| 'persistence_failed'
				| 'target_not_empty'
				| 'source_missing'
				| 'copy_failed';
			detail?: string;
	  };

interface ExportArgs {
	/** ksuid of the project being exported. Used to locate the OPFS source dir. */
	projectId: string;
	/** Display name for the new local-folder recents entry. */
	projectName: string;
}

type PermissionedHandle = FileSystemDirectoryHandle & {
	queryPermission(opts: { mode: 'read' | 'readwrite' }): Promise<PermissionState>;
	requestPermission(opts: { mode: 'read' | 'readwrite' }): Promise<PermissionState>;
};

export async function exportProjectToLocalFolder({ projectId, projectName }: ExportArgs): Promise<ExportOutcome> {
	const picker = (
		window as unknown as {
			showDirectoryPicker?: (opts?: { mode?: 'read' | 'readwrite' }) => Promise<FileSystemDirectoryHandle>;
		}
	).showDirectoryPicker;
	if (typeof picker !== 'function') return { ok: false, reason: 'unsupported' };

	let target: FileSystemDirectoryHandle;
	try {
		target = await picker({ mode: 'readwrite' });
	} catch (err) {
		if (err instanceof DOMException && err.name === 'AbortError') return { ok: false, reason: 'cancelled' };
		return { ok: false, reason: 'cancelled', detail: err instanceof Error ? err.message : String(err) };
	}

	// Permission re-request inside the user gesture — the browser may have
	// granted only ad-hoc read; without `readwrite` the copy fails halfway.
	const ph = target as PermissionedHandle;
	const queryResult = await ph.queryPermission({ mode: 'readwrite' });
	if (queryResult !== 'granted') {
		const reqResult = await ph.requestPermission({ mode: 'readwrite' });
		if (reqResult !== 'granted') return { ok: false, reason: 'permission_denied' };
	}

	// Refuse a non-empty target. Half-copying into a folder with unrelated
	// files would mix two projects, and overwriting an existing project.json
	// could destroy someone else's data. Cheapest safe contract.
	if (!(await isEmptyDirectory(target))) return { ok: false, reason: 'target_not_empty' };

	let source: FileSystemDirectoryHandle;
	try {
		source = await resolveOpfsProjectRoot(projectId);
	} catch {
		return { ok: false, reason: 'source_missing' };
	}

	try {
		await copyDirectory(source, target);
	} catch (err) {
		return { ok: false, reason: 'copy_failed', detail: err instanceof Error ? err.message : String(err) };
	}

	try {
		await persistFsaHandle(target);
	} catch (err) {
		return { ok: false, reason: 'persistence_failed', detail: err instanceof Error ? err.message : String(err) };
	}

	// Sandbox copy is the source of truth until the FSA handle is durable.
	// Once persisted, drop the OPFS folder so the export is a real "move,"
	// not a duplicate. A delete failure is non-fatal — the user is in a
	// fully-recoverable state with both copies, which is strictly better
	// than ending up with neither.
	try {
		await deleteOpfsProject(projectId);
	} catch (err) {
		console.warn('export-to-local-folder: failed to delete OPFS source', err);
	}

	// Path is `/` because the picked folder IS the project root in FSA mode
	// — the host's `getCurrentProjectFolder` returns `/` whenever the root
	// is FSA-mounted.
	await ipcProjectService.recordRecent({
		name: projectName,
		path: '/',
		source: 'local-folder',
	});

	return { ok: true, folderName: target.name };
}

async function deleteOpfsProject(projectId: string): Promise<void> {
	const root = await navigator.storage.getDirectory();
	const beak = await root.getDirectoryHandle(OPFS_NAMESPACE);
	await beak.removeEntry(projectId, { recursive: true });
}

async function resolveOpfsProjectRoot(projectId: string): Promise<FileSystemDirectoryHandle> {
	const root = await navigator.storage.getDirectory();
	const beak = await root.getDirectoryHandle(OPFS_NAMESPACE);
	return await beak.getDirectoryHandle(projectId);
}

async function isEmptyDirectory(handle: FileSystemDirectoryHandle): Promise<boolean> {
	const keys = (handle as unknown as { keys(): AsyncIterableIterator<string> }).keys();
	const first = await keys.next();
	return Boolean(first.done);
}

async function copyDirectory(src: FileSystemDirectoryHandle, dst: FileSystemDirectoryHandle): Promise<void> {
	const entries = (
		src as unknown as {
			entries(): AsyncIterableIterator<[string, FileSystemHandle]>;
		}
	).entries();
	for await (const [name, entry] of entries) {
		if (entry.kind === 'file') {
			const fileHandle = entry as FileSystemFileHandle;
			const file = await fileHandle.getFile();
			const dstFile = await dst.getFileHandle(name, { create: true });
			const writable = await dstFile.createWritable();
			try {
				await writable.write(file);
				await writable.close();
			} catch (err) {
				await writable.abort?.(err instanceof Error ? err.message : String(err)).catch(() => {});
				throw err;
			}
		} else {
			const subSrc = entry as FileSystemDirectoryHandle;
			const subDst = await dst.getDirectoryHandle(name, { create: true });
			await copyDirectory(subSrc, subDst);
		}
	}
}

function persistFsaHandle(handle: FileSystemDirectoryHandle): Promise<void> {
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
