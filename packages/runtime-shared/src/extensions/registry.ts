import type { AvailableUpdate } from '@beak/common/types/extensions';
import Squawk from '@beak/common/utils/squawk';

import { RuntimeBase } from '../base';
import { gunzip, readTar } from './tar';

/**
 * Cross-host npm registry client. Both Beak shells use this — Electron and
 * Web. We rely only on platform primitives that exist in both Node 18+
 * and modern browsers: `globalThis.fetch`, `DecompressionStream`, the
 * Web Crypto SubtleCrypto API, and the host's `providers.node.fs/path`
 * shim (`fs-extra` flavoured on Electron, OPFS-backed on Web).
 *
 * Beak extensions ship pre-bundled (zero runtime deps), so "install a
 * package" reduces to: fetch metadata → resolve version → fetch tarball
 * → verify integrity → gunzip + untar → write files. No dependency
 * resolution, no package-manager binary required on the user's machine.
 */
const DEFAULT_REGISTRY = 'https://registry.npmjs.org';
const ACCEPT_INSTALL_HEADERS = { Accept: 'application/vnd.npm.install-v1+json', 'X-Beak-Client': 'beak-extensions/1' };
const ACCEPT_JSON_HEADERS = { Accept: 'application/json', 'X-Beak-Client': 'beak-extensions/1' };
const TARBALL_HEADERS = { 'X-Beak-Client': 'beak-extensions/1' };

/** Hard cap on the tarball download. Real-world Beak extensions are well under 1 MB. */
const MAX_TARBALL_BYTES = 50 * 1024 * 1024;

interface RegistryDist {
	tarball: string;
	integrity?: string;
	shasum?: string;
}

export interface RegistryVersionMetadata {
	name: string;
	version: string;
	description?: string;
	main?: string;
	author?: string | { name?: string; email?: string; url?: string };
	homepage?: string;
	repository?: string | { type?: string; url?: string };
	keywords?: string[];
	beak?: {
		apiVersion?: number;
		displayName?: string;
		description?: string;
	};
	dist: RegistryDist;
}

export interface RegistryPackageMetadata {
	name: string;
	'dist-tags': Record<string, string>;
	versions: Record<string, RegistryVersionMetadata>;
	time?: Record<string, string>;
}

export interface RegistrySearchHit {
	package: {
		name: string;
		version: string;
		description?: string;
		date?: string;
		author?: { name?: string };
		links?: { homepage?: string; repository?: string };
	};
}

export interface ResolvedVersion {
	packageName: string;
	version: string;
	tarballUrl: string;
	integrity?: string;
	shasum?: string;
	metadata: RegistryVersionMetadata;
}

export interface ExtensionRegistryOptions {
	endpoint?: string;
	/** Optional `Authorization: Bearer <token>` for private registries. */
	token?: string;
}

export default class ExtensionRegistry extends RuntimeBase {
	private readonly endpoint: string;
	private readonly token?: string;

	constructor(providers: RuntimeBase['providers'], options: ExtensionRegistryOptions = {}) {
		super(providers);
		this.endpoint = (options.endpoint ?? DEFAULT_REGISTRY).replace(/\/$/, '');
		this.token = options.token;
	}

	async fetchMetadata(packageName: string): Promise<RegistryPackageMetadata> {
		const url = `${this.endpoint}/${packageName}`;
		const response = await fetch(url, { headers: this.authHeaders(ACCEPT_INSTALL_HEADERS) });

		if (response.status === 404) throw new Squawk('extension_not_found', { packageName });
		if (!response.ok) throw new Squawk('registry_fetch_failed', { packageName, status: response.status });

		return (await response.json()) as RegistryPackageMetadata;
	}

	async resolveVersion(packageName: string, range: string = 'latest'): Promise<ResolvedVersion> {
		const metadata = await this.fetchMetadata(packageName);
		const distTag = metadata['dist-tags']?.[range];
		const versionsList = Object.keys(metadata.versions);
		const explicit = metadata.versions[range] ? range : undefined;
		const candidate = distTag ?? explicit ?? pickHighestMatching(versionsList, range);

		if (!candidate) throw new Squawk('extension_version_not_resolvable', { packageName, range });

		const versionMeta = metadata.versions[candidate];
		if (!versionMeta?.dist?.tarball)
			throw new Squawk('extension_version_missing_tarball', { packageName, version: candidate });

		return {
			packageName,
			version: candidate,
			tarballUrl: versionMeta.dist.tarball,
			integrity: versionMeta.dist.integrity,
			shasum: versionMeta.dist.shasum,
			metadata: versionMeta,
		};
	}

	async install(resolved: ResolvedVersion, extensionsDir: string): Promise<string> {
		validatePackageName(resolved.packageName);
		const destination = packageDestination(this.p.node.path, extensionsDir, resolved.packageName);

		const response = await fetch(resolved.tarballUrl, { headers: this.authHeaders(TARBALL_HEADERS) });

		if (!response.ok)
			throw new Squawk('extension_tarball_fetch_failed', { url: resolved.tarballUrl, status: response.status });

		// Refuse silly-sized tarballs early — npm reports Content-Length when
		// the upstream is the canonical registry; if a mirror omits it we
		// still re-check after the buffer materialises.
		const declaredSize = Number(response.headers.get('content-length') ?? '');
		if (Number.isFinite(declaredSize) && declaredSize > MAX_TARBALL_BYTES) {
			throw new Squawk('extension_tarball_too_large', {
				url: resolved.tarballUrl,
				declared: declaredSize,
				limit: MAX_TARBALL_BYTES,
			});
		}

		const tarballBytes = new Uint8Array(await response.arrayBuffer());

		if (tarballBytes.byteLength > MAX_TARBALL_BYTES) {
			throw new Squawk('extension_tarball_too_large', {
				url: resolved.tarballUrl,
				actual: tarballBytes.byteLength,
				limit: MAX_TARBALL_BYTES,
			});
		}

		await verifyIntegrity(tarballBytes, resolved.integrity, resolved.shasum);

		const fs = this.p.node.fs.promises;

		// Idempotent: wipe any previous install of this package before writing fresh files.
		await removeTree(fs, destination);
		await mkdirRecursive(fs, destination);

		const tarBytes = await gunzip(tarballBytes);

		for (const entry of readTar(tarBytes)) {
			// npm wraps everything under `package/<…>`. Strip the prefix so files
			// land directly under the destination folder.
			const relative = entry.name.replace(/^package\//, '');
			if (!relative) continue;
			if (relative.includes('..')) continue; // defence in depth against zip-slip-style entries

			const target = this.p.node.path.join(destination, relative);
			await mkdirRecursive(fs, this.p.node.path.dirname(target));
			await fs.writeFile(target, entry.bytes);
		}

		return destination;
	}

	async remove(packageName: string, extensionsDir: string): Promise<void> {
		validatePackageName(packageName);
		const destination = packageDestination(this.p.node.path, extensionsDir, packageName);
		await removeTree(this.p.node.fs.promises, destination);
	}

	/**
	 * Return an {@link AvailableUpdate} when the registry reports a `latest`
	 * dist-tag newer than `currentVersion`, otherwise `null`. Network
	 * failures bubble — callers that want to batch should `.catch(() => null)`
	 * per call so one failing package doesn't kill the lot.
	 */
	async checkUpdate(packageName: string, currentVersion: string): Promise<AvailableUpdate | null> {
		validatePackageName(packageName);
		const metadata = await this.fetchMetadata(packageName);
		const latest = metadata['dist-tags']?.latest;
		if (!latest || latest === currentVersion) return null;

		return {
			packageName,
			currentVersion,
			latestVersion: latest,
			publishedAt: metadata.time?.[latest],
		};
	}

	async search(query: string, limit: number = 20): Promise<RegistrySearchHit[]> {
		const url = `${this.endpoint}/-/v1/search?text=${encodeURIComponent(query)}&size=${limit}`;
		const response = await fetch(url, { headers: this.authHeaders(ACCEPT_JSON_HEADERS) });

		if (!response.ok) throw new Squawk('registry_search_failed', { query, status: response.status });

		const json = (await response.json()) as { objects?: RegistrySearchHit[] };
		return json.objects ?? [];
	}

	private authHeaders(base: Record<string, string>): Record<string, string> {
		return this.token ? { ...base, Authorization: `Bearer ${this.token}` } : base;
	}
}

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                   */
/* -------------------------------------------------------------------------- */

interface PathLike {
	join(...segments: string[]): string;
	dirname(p: string): string;
}

export function packageDestination(path: PathLike, extensionsDir: string, packageName: string): string {
	const segments = packageName.split('/');
	return path.join(extensionsDir, 'node_modules', ...segments);
}

function validatePackageName(name: string): void {
	// Catches both `../escape` and absolute paths early. The npm spec allows
	// scoped packages (`@scope/name`) but never path-traversal characters.
	if (name.includes('..') || name.startsWith('/') || /[\0\\]/.test(name))
		throw new Squawk('extension_invalid_package_name', { packageName: name });
}

export async function verifyIntegrity(bytes: Uint8Array, integrity?: string, shasum?: string): Promise<void> {
	if (integrity) {
		const dashIndex = integrity.indexOf('-');
		if (dashIndex === -1) throw new Squawk('extension_integrity_malformed', { integrity });

		const algorithm = integrity.slice(0, dashIndex);
		const expected = integrity.slice(dashIndex + 1);
		const subtleAlgo = subtleAlgorithm(algorithm);

		const digest = await crypto.subtle.digest(subtleAlgo, bytes.buffer as ArrayBuffer);
		const actual = bytesToBase64(new Uint8Array(digest));

		if (actual !== expected) throw new Squawk('extension_integrity_mismatch', { algorithm, expected, actual });

		return;
	}

	if (shasum) {
		const digest = await crypto.subtle.digest('SHA-1', bytes.buffer as ArrayBuffer);
		const actual = bytesToHex(new Uint8Array(digest));
		if (actual !== shasum) throw new Squawk('extension_shasum_mismatch', { expected: shasum, actual });

		return;
	}

	throw new Squawk('extension_integrity_missing', { reason: 'registry did not provide integrity or shasum' });
}

function subtleAlgorithm(name: string): string {
	switch (name.toLowerCase()) {
		case 'sha1':
			return 'SHA-1';
		case 'sha256':
			return 'SHA-256';
		case 'sha384':
			return 'SHA-384';
		case 'sha512':
			return 'SHA-512';
		default:
			throw new Squawk('extension_integrity_unsupported_algorithm', { algorithm: name });
	}
}

function bytesToBase64(bytes: Uint8Array): string {
	let binary = '';
	for (let i = 0; i < bytes.length; i += 1) binary += String.fromCharCode(bytes[i]);
	return typeof btoa === 'function'
		? btoa(binary)
		: Buffer.from(bytes).toString('base64');
}

function bytesToHex(bytes: Uint8Array): string {
	const out = new Array(bytes.length);
	for (let i = 0; i < bytes.length; i += 1) out[i] = bytes[i].toString(16).padStart(2, '0');
	return out.join('');
}

/**
 * Minimal semver matcher: `^X.Y.Z`, `~X.Y.Z`, `>=X.Y.Z`, exact, or `*`.
 * Extension authors can express the majority of intent with these — and
 * the registry's dist-tags (`latest`, `next`) are always available for
 * anything fancier.
 */
function pickHighestMatching(versions: string[], range: string): string | undefined {
	if (range === '*') return versions.slice().sort(compareSemver).pop();
	if (/^\d+\.\d+\.\d+/.test(range) && !/^[\^~>]/.test(range)) return versions.includes(range) ? range : undefined;

	const operator = range.startsWith('^') ? '^' : range.startsWith('~') ? '~' : range.startsWith('>=') ? '>=' : null;
	if (!operator) return undefined;

	const target = parseVersion(range.replace(/^[\^~]|^>=/, ''));
	if (!target) return undefined;

	const matched = versions
		.map(v => ({ v, parsed: parseVersion(v) }))
		.filter((x): x is { v: string; parsed: [number, number, number] } => Boolean(x.parsed))
		.filter(x => {
			const [a, b, c] = x.parsed;
			const [ta, tb, tc] = target;
			if (operator === '^') return a === ta && (b > tb || (b === tb && c >= tc));
			if (operator === '~') return a === ta && b === tb && c >= tc;
			return a > ta || (a === ta && (b > tb || (b === tb && c >= tc)));
		})
		.sort((x, y) => compareSemver(x.v, y.v));

	return matched[matched.length - 1]?.v;
}

function parseVersion(version: string): [number, number, number] | null {
	const match = /^(\d+)\.(\d+)\.(\d+)/.exec(version);
	if (!match) return null;
	return [Number(match[1]), Number(match[2]), Number(match[3])];
}

function compareSemver(a: string, b: string): number {
	const pa = parseVersion(a) ?? [0, 0, 0];
	const pb = parseVersion(b) ?? [0, 0, 0];
	if (pa[0] !== pb[0]) return pa[0] - pb[0];
	if (pa[1] !== pb[1]) return pa[1] - pb[1];
	return pa[2] - pb[2];
}

interface MinimalFsPromises {
	mkdir(path: string, opts?: { recursive?: boolean }): Promise<string | undefined | void>;
	writeFile(path: string, data: Uint8Array): Promise<void>;
	unlink(path: string): Promise<void>;
	rmdir?(path: string, opts?: { recursive?: boolean }): Promise<void>;
	rm?(path: string, opts?: { recursive?: boolean; force?: boolean }): Promise<void>;
	stat(path: string): Promise<{ isDirectory(): boolean }>;
}

async function mkdirRecursive(fs: MinimalFsPromises, path: string): Promise<void> {
	try {
		await fs.mkdir(path, { recursive: true });
	} catch (error) {
		if ((error as { code?: string }).code !== 'EEXIST') throw error;
	}
}

async function removeTree(fs: MinimalFsPromises, path: string): Promise<void> {
	try {
		if (fs.rm) {
			await fs.rm(path, { recursive: true, force: true });
			return;
		}

		const stats = await fs.stat(path).catch(() => null);
		if (!stats) return;

		if (stats.isDirectory()) await fs.rmdir?.(path, { recursive: true });
		else await fs.unlink(path);
	} catch (error) {
		if ((error as { code?: string }).code !== 'ENOENT') throw error;
	}
}
