/**
 * OPFS-backed implementation of the `fs.promises` surface that
 * isomorphic-git + the Beak runtime use. Replaces the previous
 * lightning-fs-over-IndexedDB backing, which spent 10+ seconds on a
 * git.commit of a 5-file project because every transaction round-tripped
 * through IDB.
 *
 * OPFS is synchronous-friendly under the hood — `getFileHandle` /
 * `createWritable` are async but the bytes don't go through structured
 * cloning + an IDB transaction the way lightning-fs does. Result: commits
 * land in tens of milliseconds, not seconds.
 *
 * Surface implemented:
 *   readFile, writeFile, unlink, readdir, mkdir, rmdir, stat, lstat,
 *   rename, readlink (throws), symlink (throws).
 *
 * NOT implemented (isomorphic-git tolerates the absence):
 *   chmod, chown — POSIX permissions don't apply.
 *
 * Notes:
 *   * Paths are interpreted as Posix-style, leading `/` optional. A
 *     `''` or `'/'` path refers to the root of the OPFS namespace.
 *   * Stat times: OPFS doesn't expose ctime/atime, only the File.lastModified
 *     for files. Directories have no mtime — we synthesise 0. isomorphic-git
 *     only uses mtimeMs/size for cache invalidation, so this is fine.
 *   * Symbolic links: OPFS doesn't support them. `symlink` throws ENOTSUP
 *     and `readlink` throws EINVAL — matching what Node does on filesystems
 *     without symlink support.
 */

const ENOENT = (path: string) => makeError('ENOENT', `no such file or directory, ${path}`);
const EISDIR = (path: string) => makeError('EISDIR', `is a directory, ${path}`);
const ENOTDIR = (path: string) => makeError('ENOTDIR', `not a directory, ${path}`);
const ENOTSUP = (op: string) => makeError('ENOTSUP', `${op} is not supported on OPFS`);

function makeError(code: string, message: string): Error & { code: string } {
	const err = new Error(message) as Error & { code: string };
	err.code = code;
	return err;
}

export interface OpfsStats {
	type: 'file' | 'dir' | 'symlink';
	size: number;
	mtimeMs: number;
	ctimeMs: number;
	atimeMs: number;
	mode: number;
	uid: number;
	gid: number;
	dev: number;
	ino: number;
	nlink: number;
	isFile: () => boolean;
	isDirectory: () => boolean;
	isSymbolicLink: () => boolean;
	atime: Date;
	mtime: Date;
	ctime: Date;
	birthtime: Date;
	birthtimeMs: number;
}

function makeStats(type: 'file' | 'dir', size: number, mtimeMs: number): OpfsStats {
	const atime = new Date(mtimeMs);
	return {
		type,
		size,
		mtimeMs,
		ctimeMs: mtimeMs,
		atimeMs: mtimeMs,
		birthtimeMs: mtimeMs,
		mode: type === 'dir' ? 0o40755 : 0o100644,
		uid: 0,
		gid: 0,
		dev: 1,
		ino: 0,
		nlink: 1,
		atime,
		mtime: atime,
		ctime: atime,
		birthtime: atime,
		isFile: () => type === 'file',
		isDirectory: () => type === 'dir',
		isSymbolicLink: () => false,
	};
}

function parsePath(p: string): string[] {
	if (!p || p === '/' || p === '.') return [];
	let s = p;
	if (s.startsWith('/')) s = s.slice(1);
	if (s.endsWith('/')) s = s.slice(0, -1);
	return s.split('/').filter(seg => seg.length > 0 && seg !== '.');
}

interface ResolveOptions {
	createIntermediate?: boolean;
}

export type OpfsFsEventName = 'add' | 'change' | 'unlink' | 'addDir' | 'unlinkDir';

export interface OpfsFsEvent {
	eventName: OpfsFsEventName;
	path: string;
}

export type OpfsFsListener = (event: OpfsFsEvent) => void;

export default class OpfsFs {
	readonly promises: OpfsFsPromises;
	private rootPromise: Promise<FileSystemDirectoryHandle>;
	private listeners = new Set<OpfsFsListener>();

	/**
	 * Construct with either:
	 *   * a namespace string — root is `<OPFS>/{namespace}` (the default).
	 *   * a `Promise<FileSystemDirectoryHandle>` — root is whatever that
	 *     promise resolves to. Used by the File-System-Access path to mount
	 *     a user-picked folder behind the same `fs.promises` surface.
	 */
	constructor(rootOrNamespace: string | Promise<FileSystemDirectoryHandle>) {
		if (typeof rootOrNamespace === 'string') {
			this.rootPromise = navigator.storage
				.getDirectory()
				.then(root => root.getDirectoryHandle(rootOrNamespace, { create: true }));
		} else {
			this.rootPromise = rootOrNamespace;
		}
		this.promises = new OpfsFsPromises(this, e => this.emit(e));
	}

	async root(): Promise<FileSystemDirectoryHandle> {
		return this.rootPromise;
	}

	/**
	 * Subscribe to mutation events emitted by this fs. Returns an unsubscribe
	 * function. Errors thrown by a listener are swallowed so one bad consumer
	 * can't break others.
	 *
	 * Emitted events mirror chokidar's shape (`add`/`change`/`unlink`/
	 * `addDir`/`unlinkDir`) so the web `fs-watcher-service` can fan them out
	 * to renderer-side watcher sessions verbatim.
	 */
	onChange(fn: OpfsFsListener): () => void {
		this.listeners.add(fn);
		return () => {
			this.listeners.delete(fn);
		};
	}

	private emit(event: OpfsFsEvent) {
		for (const l of this.listeners) {
			try {
				l(event);
			} catch {
				/* a misbehaving listener mustn't drop events for others */
			}
		}
	}
}

class OpfsFsPromises {
	constructor(
		private readonly fs: OpfsFs,
		private readonly emit: (event: OpfsFsEvent) => void,
	) {}

	private async exists(path: string): Promise<'file' | 'dir' | null> {
		try {
			const stats = await this.stat(path);
			return stats.isDirectory() ? 'dir' : 'file';
		} catch {
			return null;
		}
	}

	private async resolveDir(segments: string[], opts: ResolveOptions = {}): Promise<FileSystemDirectoryHandle> {
		let cur = await this.fs.root();
		for (const seg of segments) {
			try {
				cur = await cur.getDirectoryHandle(seg, { create: opts.createIntermediate });
			} catch (err) {
				if (err instanceof DOMException && err.name === 'TypeMismatchError') throw ENOTDIR(segments.join('/'));
				if (err instanceof DOMException && err.name === 'NotFoundError') throw ENOENT(segments.join('/'));
				throw err;
			}
		}
		return cur;
	}

	private async resolveFile(
		path: string,
		opts: { create?: boolean } = {},
	): Promise<{ parent: FileSystemDirectoryHandle; name: string; handle: FileSystemFileHandle }> {
		const segments = parsePath(path);
		if (segments.length === 0) throw EISDIR(path);
		const name = segments[segments.length - 1]!;
		const dirSegments = segments.slice(0, -1);
		const parent = await this.resolveDir(dirSegments, { createIntermediate: opts.create });
		try {
			const handle = await parent.getFileHandle(name, { create: opts.create });
			return { parent, name, handle };
		} catch (err) {
			if (err instanceof DOMException && err.name === 'NotFoundError') throw ENOENT(path);
			if (err instanceof DOMException && err.name === 'TypeMismatchError') throw EISDIR(path);
			throw err;
		}
	}

	async readFile(
		path: string,
		options?: { encoding?: 'utf8' | string } | 'utf8' | string,
	): Promise<Uint8Array | string> {
		const { handle } = await this.resolveFile(path);
		const file = await handle.getFile();
		const buf = new Uint8Array(await file.arrayBuffer());
		const encoding = typeof options === 'string' ? options : options?.encoding;
		if (encoding === 'utf8' || encoding === 'utf-8') {
			return new TextDecoder('utf-8').decode(buf);
		}
		return buf;
	}

	async writeFile(
		path: string,
		data: Uint8Array | ArrayBuffer | string,
		options?: { encoding?: string } | string,
	): Promise<void> {
		// `add` vs `change` differs only in the renderer's self-write
		// suppression (`change` events get debounced against `latestWrite`;
		// `add` events don't). Stat before write so we can emit the right one.
		const existed = (await this.exists(path)) === 'file';
		const { handle } = await this.resolveFile(path, { create: true });
		const writable = await handle.createWritable();
		try {
			const chunk: BufferSource =
				typeof data === 'string'
					? (new TextEncoder().encode(data) as unknown as BufferSource)
					: (data as unknown as BufferSource);
			await writable.write(chunk as unknown as Parameters<typeof writable.write>[0]);
			await writable.close();
		} catch (err) {
			await writable.abort(err instanceof Error ? err.message : String(err)).catch(() => {});
			throw err;
		}
		this.emit({ eventName: existed ? 'change' : 'add', path });
		void options;
	}

	async unlink(path: string): Promise<void> {
		const segments = parsePath(path);
		if (segments.length === 0) throw EISDIR(path);
		const name = segments[segments.length - 1]!;
		const parent = await this.resolveDir(segments.slice(0, -1));
		try {
			await parent.removeEntry(name);
		} catch (err) {
			if (err instanceof DOMException && err.name === 'NotFoundError') throw ENOENT(path);
			if (err instanceof DOMException && err.name === 'InvalidModificationError') throw EISDIR(path);
			throw err;
		}
		this.emit({ eventName: 'unlink', path });
	}

	async readdir(path: string): Promise<string[]> {
		const segments = parsePath(path);
		const dir = await this.resolveDir(segments);
		const out: string[] = [];
		// FileSystemDirectoryHandle's default async iterator yields
		// `[name, handle]` tuples (equivalent to `entries()`), not bare names
		// — the WHATWG FS spec mirrors Map's iterator. We want just the names,
		// so iterate `.keys()` explicitly. Casting to AsyncIterable<string>
		// here is wrong: the default iterator returns tuples and any
		// downstream `path.join(dir, name)` would receive an array and throw.
		const keys = (dir as unknown as { keys(): AsyncIterableIterator<string> }).keys();
		for await (const name of keys) {
			out.push(name);
		}
		return out;
	}

	async mkdir(path: string, opts?: { recursive?: boolean }): Promise<void> {
		const segments = parsePath(path);
		if (segments.length === 0) return;
		const recursive = Boolean(opts?.recursive);

		if (recursive) {
			// Find the deepest existing prefix so we can emit `addDir` for each
			// freshly-created level. Chokidar does the same on native recursive
			// directory creation; without it the renderer won't see intermediate
			// folders that the watcher should know about (e.g. when OpenAPI
			// sync writes `tree/openapi/users/...` from a virgin project).
			const fresh: string[] = [];
			for (let i = segments.length; i > 0; i--) {
				const probe = segments.slice(0, i).join('/');
				if ((await this.exists(probe)) === 'dir') break;
				fresh.unshift(probe);
			}
			await this.resolveDir(segments, { createIntermediate: true });
			const prefix = path.startsWith('/') ? '/' : '';
			for (const seg of fresh) this.emit({ eventName: 'addDir', path: `${prefix}${seg}` });
			return;
		}

		const name = segments[segments.length - 1]!;
		const parent = await this.resolveDir(segments.slice(0, -1));
		// Existence check — Node's non-recursive mkdir throws EEXIST if the target
		// already exists. OPFS would create-or-no-op silently.
		try {
			await parent.getDirectoryHandle(name);
			const exists = makeError('EEXIST', `file already exists, ${path}`);
			throw exists;
		} catch (err) {
			if (err instanceof Error && (err as { code?: string }).code === 'EEXIST') throw err;
			// NotFoundError means it doesn't exist yet — go create it.
		}
		await parent.getDirectoryHandle(name, { create: true });
		this.emit({ eventName: 'addDir', path });
	}

	/**
	 * Mirrors Node's `fs.promises.rm`. Unifies file + directory removal so
	 * callers don't need to stat first. With `recursive: true`, directories
	 * are removed with all contents. With `force: true`, missing paths are
	 * silently ignored (Node semantics).
	 */
	async rm(path: string, opts?: { recursive?: boolean; force?: boolean }): Promise<void> {
		const recursive = Boolean(opts?.recursive);
		const force = Boolean(opts?.force);
		let stats: OpfsStats;
		try {
			stats = await this.stat(path);
		} catch (err) {
			if (force && err instanceof Error && (err as { code?: string }).code === 'ENOENT') return;
			throw err;
		}
		if (stats.isDirectory()) {
			await this.rmdir(path, { recursive });
			return;
		}
		await this.unlink(path);
	}

	async rmdir(path: string, opts?: { recursive?: boolean }): Promise<void> {
		const segments = parsePath(path);
		if (segments.length === 0) throw makeError('EBUSY', 'cannot remove OPFS root');
		const name = segments[segments.length - 1]!;
		const parent = await this.resolveDir(segments.slice(0, -1));
		try {
			await parent.removeEntry(name, { recursive: Boolean(opts?.recursive) });
		} catch (err) {
			if (err instanceof DOMException && err.name === 'NotFoundError') throw ENOENT(path);
			if (err instanceof DOMException && err.name === 'InvalidModificationError') {
				throw makeError('ENOTEMPTY', `directory not empty, ${path}`);
			}
			throw err;
		}
		this.emit({ eventName: 'unlinkDir', path });
	}

	async stat(path: string): Promise<OpfsStats> {
		const segments = parsePath(path);
		if (segments.length === 0) return makeStats('dir', 0, 0);
		const name = segments[segments.length - 1]!;
		const parent = await this.resolveDir(segments.slice(0, -1));

		// Try file first (much more common).
		try {
			const handle = await parent.getFileHandle(name);
			const file = await handle.getFile();
			return makeStats('file', file.size, file.lastModified);
		} catch (fileErr) {
			if (!(fileErr instanceof DOMException)) throw fileErr;
			if (fileErr.name !== 'NotFoundError' && fileErr.name !== 'TypeMismatchError') throw fileErr;
		}

		// Fall back to dir.
		try {
			await parent.getDirectoryHandle(name);
			return makeStats('dir', 0, 0);
		} catch (dirErr) {
			if (dirErr instanceof DOMException && dirErr.name === 'NotFoundError') throw ENOENT(path);
			throw dirErr;
		}
	}

	async lstat(path: string): Promise<OpfsStats> {
		return this.stat(path);
	}

	async rename(oldPath: string, newPath: string): Promise<void> {
		// OPFS has no native rename. We implement it as copy + delete for files,
		// recursive copy + delete for directories. Slow for large trees — Beak
		// projects are small enough that this is acceptable for now.
		// Per-step events (writeFile / unlink / mkdir / rmdir) are emitted by
		// the underlying calls — no extra wiring needed here.
		const stats = await this.stat(oldPath);
		if (stats.isDirectory()) {
			await this.copyDirectory(oldPath, newPath);
			await this.rmdir(oldPath, { recursive: true });
		} else {
			const data = await this.readFile(oldPath);
			await this.writeFile(newPath, data);
			await this.unlink(oldPath);
		}
	}

	private async copyDirectory(src: string, dst: string): Promise<void> {
		await this.mkdir(dst, { recursive: true });
		const entries = await this.readdir(src);
		for (const entry of entries) {
			const srcPath = `${src}/${entry}`;
			const dstPath = `${dst}/${entry}`;
			const stats = await this.stat(srcPath);
			if (stats.isDirectory()) {
				await this.copyDirectory(srcPath, dstPath);
			} else {
				const data = await this.readFile(srcPath);
				await this.writeFile(dstPath, data);
			}
		}
	}

	async readlink(_path: string): Promise<string> {
		throw ENOTSUP('readlink');
	}

	async symlink(_target: string, _path: string): Promise<void> {
		throw ENOTSUP('symlink');
	}

	async chmod(_path: string, _mode: number): Promise<void> {
		// No-op — OPFS has no POSIX permissions, but isomorphic-git calls chmod
		// during clone/checkout. Silently accepting matches the behaviour
		// lightning-fs used to give.
	}

	/**
	 * Best-effort flush. lightning-fs debounces its superblock save; OPFS
	 * has no equivalent (writes are durable when `WritableStream.close()`
	 * resolves), but call sites use `fs.promises.flush()` so we keep a no-op
	 * shim to avoid an undefined-method crash.
	 */
	async flush(): Promise<void> {
		/* writes are durable as soon as the underlying close resolves */
	}
}
