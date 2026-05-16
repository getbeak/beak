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

export default class OpfsFs {
	readonly promises: OpfsFsPromises;
	private rootPromise: Promise<FileSystemDirectoryHandle>;

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
		this.promises = new OpfsFsPromises(this);
	}

	async root(): Promise<FileSystemDirectoryHandle> {
		return this.rootPromise;
	}
}

class OpfsFsPromises {
	constructor(private readonly fs: OpfsFs) {}

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
	}

	async readdir(path: string): Promise<string[]> {
		const segments = parsePath(path);
		const dir = await this.resolveDir(segments);
		const out: string[] = [];
		// FileSystemDirectoryHandle implements an async iterator over its keys.
		for await (const name of (dir as unknown as AsyncIterable<string>)) {
			out.push(name);
		}
		return out;
	}

	async mkdir(path: string, opts?: { recursive?: boolean }): Promise<void> {
		const segments = parsePath(path);
		if (segments.length === 0) return;
		const recursive = Boolean(opts?.recursive);

		if (recursive) {
			await this.resolveDir(segments, { createIntermediate: true });
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

