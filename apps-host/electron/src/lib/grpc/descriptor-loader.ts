import path from 'node:path';

import type { GrpcDescriptorIpc } from '@beak/common/ipc/grpc';
import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import protobuf from 'protobufjs';
import descriptor from 'protobufjs/ext/descriptor';

import { parseGrpcEndpoint } from './endpoint';
import { REFLECTION_PROTO } from './reflection-proto';

/**
 * Returned by `loadDescriptor` — a protobufjs Root with every message
 * + service in the transitive closure of the requested descriptor.
 * Callers look up `requestType` / `responseType` from it before invoking
 * gRPC methods.
 */
export interface LoadedDescriptor {
	root: protobuf.Root;
}

/**
 * Resolve every message + service shape Beak needs to invoke methods on the
 * target endpoint, regardless of how the user told us to find them.
 *
 *  - `reflection` — walks the server's reflection service for every
 *    `FileDescriptorProto` reachable from the service symbol, including
 *    transitive imports. Re-runs on every call; cheap enough that caching
 *    isn't worth the staleness window for an MVP.
 *  - `proto` — defers to `@grpc/proto-loader` which already handles
 *    multi-file imports.
 *  - `buf` — not wired (Buf Schema Registry HTTP API call is a follow-up).
 */
export async function loadDescriptor(
	endpoint: string,
	desc: GrpcDescriptorIpc,
	projectFolder: string | null,
): Promise<LoadedDescriptor> {
	switch (desc.type) {
		case 'reflection':
			return loadViaReflection(endpoint);
		case 'proto': {
			// `desc.path` was already sandboxed by the caller (the IPC handler
			// runs `ensureWithinProject`). We resolve here for proto-loader's
			// include-dir logic.
			const protoPath = projectFolder
				? path.isAbsolute(desc.path)
					? desc.path
					: path.join(projectFolder, desc.path)
				: desc.path;
			return loadViaProtoFile(protoPath);
		}
		case 'buf':
			throw new Error(
				'Buf Schema Registry descriptors are not yet wired up — use reflection or a local proto file for now.',
			);
	}
}

// ─── Reflection ─────────────────────────────────────────────────────────────

const REFLECTION_METHOD_PATH = '/grpc.reflection.v1alpha.ServerReflection/ServerReflectionInfo';
const REFLECTION_TIMEOUT_MS = 15_000;

interface ReflectionTypes {
	request: protobuf.Type;
	response: protobuf.Type;
}

let cachedReflectionTypes: ReflectionTypes | null = null;
function getReflectionTypes(): ReflectionTypes {
	if (cachedReflectionTypes) return cachedReflectionTypes;
	const root = protobuf.parse(REFLECTION_PROTO).root;
	cachedReflectionTypes = {
		request: root.lookupType('grpc.reflection.v1alpha.ServerReflectionRequest'),
		response: root.lookupType('grpc.reflection.v1alpha.ServerReflectionResponse'),
	};
	return cachedReflectionTypes;
}

async function loadViaReflection(endpoint: string): Promise<LoadedDescriptor> {
	const parsed = parseGrpcEndpoint(endpoint);
	const hasExplicitScheme = /^(grpc|grpcs|http|https):\/\//i.test(endpoint.trim());

	// Same TLS-with-plaintext-fallback strategy as the reflection discovery
	// path; keep these in sync so a discoverable endpoint stays invokable.
	const attempts: boolean[] = [parsed.useTls];
	if (!hasExplicitScheme && parsed.useTls) attempts.push(false);

	let lastError: unknown = null;
	for (const useTls of attempts) {
		const credentials = useTls ? grpc.credentials.createSsl() : grpc.credentials.createInsecure();
		const client = new grpc.Client(parsed.address, credentials);
		try {
			const fileDescriptors = await collectAllFileDescriptors(client);
			client.close();
			return { root: buildRootFromDescriptors(fileDescriptors) };
		} catch (err) {
			try {
				client.close();
			} catch {
				/* socket already closed */
			}
			lastError = err;
			if (!isLikelyTlsMismatch(err) || useTls === attempts[attempts.length - 1]) throw err;
		}
	}
	throw lastError instanceof Error ? lastError : new Error('Reflection descriptor load failed');
}

/**
 * Pull every `FileDescriptorProto` the server knows about, in two passes:
 *
 *  1. `list_services: '*'` to enumerate the application services.
 *  2. For each service, `file_containing_symbol` to get the file (plus
 *     a transitive chase of dependencies via `file_by_filename`).
 *
 * Deduplicates by file name so a diamond import doesn't bloat the
 * resulting descriptor set.
 */
async function collectAllFileDescriptors(client: grpc.Client): Promise<Uint8Array[]> {
	const types = getReflectionTypes();
	const serialize = (value: unknown) =>
		Buffer.from(types.request.encode(types.request.fromObject(value as object)).finish());
	const deserialize = (buf: Buffer) => types.response.decode(buf).toJSON();

	const services = await callReflectionOnce(client, serialize, deserialize, { listServices: '*' }, response => {
		const body = response as Record<string, unknown>;
		if (body.errorResponse) throw reflectionError(body.errorResponse);
		if (!body.listServicesResponse) return null;
		const list = body.listServicesResponse as { service?: Array<{ name?: string }> };
		return (list.service ?? [])
			.map(s => s.name)
			.filter((n): n is string => typeof n === 'string' && !n.startsWith('grpc.reflection.'))
			.sort();
	});

	const seenFiles = new Set<string>();
	const pending: string[] = [];
	const collected: Array<{ bytes: Uint8Array; name: string }> = [];

	for (const svc of services) {
		const initial = await callReflectionOnce(client, serialize, deserialize, { fileContainingSymbol: svc }, r => {
			const body = r as Record<string, unknown>;
			if (body.errorResponse) throw reflectionError(body.errorResponse);
			if (!body.fileDescriptorResponse) return null;
			const fdr = body.fileDescriptorResponse as { fileDescriptorProto?: string[] };
			return (fdr.fileDescriptorProto ?? []).map(b64 => Uint8Array.from(Buffer.from(b64, 'base64')));
		});
		for (const bytes of initial) {
			const { name, deps } = peekFileNameAndDeps(bytes);
			if (seenFiles.has(name)) continue;
			seenFiles.add(name);
			collected.push({ bytes, name });
			for (const dep of deps) if (!seenFiles.has(dep)) pending.push(dep);
		}
	}

	while (pending.length > 0) {
		const fname = pending.shift();
		if (!fname || seenFiles.has(fname)) continue;
		const more = await callReflectionOnce(client, serialize, deserialize, { fileByFilename: fname }, r => {
			const body = r as Record<string, unknown>;
			if (body.errorResponse) throw reflectionError(body.errorResponse);
			if (!body.fileDescriptorResponse) return null;
			const fdr = body.fileDescriptorResponse as { fileDescriptorProto?: string[] };
			return (fdr.fileDescriptorProto ?? []).map(b64 => Uint8Array.from(Buffer.from(b64, 'base64')));
		}).catch(() => [] as Uint8Array[]); // Missing dep file isn't fatal — protobufjs can usually still resolve.

		for (const bytes of more) {
			const { name, deps } = peekFileNameAndDeps(bytes);
			if (seenFiles.has(name)) continue;
			seenFiles.add(name);
			collected.push({ bytes, name });
			for (const dep of deps) if (!seenFiles.has(dep)) pending.push(dep);
		}
	}

	return collected.map(c => c.bytes);
}

function reflectionError(body: unknown): Error {
	const err = body as { errorMessage?: string; errorCode?: number };
	return new Error(`Reflection error ${err.errorCode ?? '?'}: ${err.errorMessage ?? 'no message'}`);
}

function callReflectionOnce<T>(
	client: grpc.Client,
	serialize: (v: unknown) => Buffer,
	deserialize: (b: Buffer) => unknown,
	body: Record<string, unknown>,
	pluck: (response: unknown) => T | null,
): Promise<T> {
	return new Promise<T>((resolve, reject) => {
		const stream = client.makeBidiStreamRequest(REFLECTION_METHOD_PATH, serialize, deserialize, new grpc.Metadata(), {
			deadline: new Date(Date.now() + REFLECTION_TIMEOUT_MS),
		});
		let settled = false;
		const settle = (fn: () => void) => {
			if (settled) return;
			settled = true;
			try {
				stream.end();
			} catch {
				/* socket already closed */
			}
			fn();
		};
		stream.on('data', (frame: unknown) => {
			try {
				const plucked = pluck(frame);
				if (plucked !== null) settle(() => resolve(plucked));
			} catch (err) {
				settle(() => reject(err instanceof Error ? err : new Error(String(err))));
			}
		});
		stream.on('error', (err: Error) => settle(() => reject(err)));
		stream.on('end', () => settle(() => reject(new Error('Reflection stream ended before producing a response'))));
		stream.write(body);
	});
}

/**
 * Pre-decode just enough of a `FileDescriptorProto` to read its `name` and
 * `dependency` list. We pay the full descriptor decode once we know we
 * actually need the file's schema — for unique-ing and the dependency
 * crawl it's cheaper to look at the two fields we care about.
 */
function peekFileNameAndDeps(bytes: Uint8Array): { name: string; deps: string[] } {
	const fd = (
		descriptor as unknown as {
			FileDescriptorProto: { decode: (buf: Uint8Array) => unknown };
		}
	).FileDescriptorProto.decode(bytes) as { name?: string; dependency?: string[] };
	return { name: fd.name ?? '', deps: fd.dependency ?? [] };
}

/**
 * Hand a collection of `FileDescriptorProto` byte blobs to protobufjs via a
 * `FileDescriptorSet`. The result is a Root that can resolve every symbol
 * by FQ name (e.g. `helloworld.HelloRequest`).
 */
function buildRootFromDescriptors(fileBytes: Uint8Array[]): protobuf.Root {
	const FileDescriptorSet = (
		descriptor as unknown as {
			FileDescriptorSet: protobuf.Type;
		}
	).FileDescriptorSet;
	const files = fileBytes.map(b =>
		(
			descriptor as unknown as {
				FileDescriptorProto: { decode: (buf: Uint8Array) => unknown };
			}
		).FileDescriptorProto.decode(b),
	);
	const set = FileDescriptorSet.fromObject({ file: files });
	const root = (
		protobuf.Root as unknown as {
			fromDescriptor: (set: unknown) => protobuf.Root;
		}
	).fromDescriptor(set);
	root.resolveAll();
	return root;
}

function isLikelyTlsMismatch(err: unknown): boolean {
	if (!err || typeof err !== 'object') return false;
	const e = err as { code?: number; message?: string };
	const msg = String(e.message ?? '');
	if (e.code !== 14) return false;
	return /wrong version number/i.test(msg) || /SSL routines/i.test(msg) || /tls/i.test(msg) || /deadline/i.test(msg);
}

// ─── Proto file ─────────────────────────────────────────────────────────────

async function loadViaProtoFile(protoPath: string): Promise<LoadedDescriptor> {
	// `proto-loader`'s descriptor pipeline produces a runtime PackageDefinition
	// that's optimised for grpc-js's static client codegen — handy for
	// invocation, less so for "let me poke at message types ad hoc". For
	// parity with the reflection path (which yields a protobufjs Root) we
	// also load via protobufjs directly so the invoker has one shape to
	// reason about.
	const root = await protobuf.load(protoPath);
	root.resolveAll();
	// We still want proto-loader's view too, to validate it's a real proto
	// file rather than silently returning an empty root.
	await protoLoader.load(protoPath, { keepCase: false, includeDirs: [path.dirname(protoPath)] });
	return { root };
}
