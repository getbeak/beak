import type { GrpcDescriptorIpc, InvokeUnaryRes } from '@beak/common/ipc/grpc';
import * as grpc from '@grpc/grpc-js';
import type protobuf from 'protobufjs';

import { loadDescriptor } from './descriptor-loader';
import { parseGrpcEndpoint } from './endpoint';

const DEFAULT_DEADLINE_MS = 30_000;

export interface InvokeUnaryHostArgs {
	endpoint: string;
	descriptor: GrpcDescriptorIpc;
	service: string;
	method: string;
	requestJson: string;
	metadata?: Record<string, string>;
	deadlineMs?: number;
	projectFolder: string | null;
}

/**
 * Make a single unary gRPC call against `endpoint`, encoding the JSON
 * request into protobuf and decoding the response back to JSON. Streaming
 * methods (client / server / bidi) reject with a clear message — they
 * need a different UI affordance and are tracked separately.
 *
 * Errors of various kinds:
 *   - Descriptor load failure (reflection refused, proto file missing) →
 *     rejection from `loadDescriptor`, propagates to renderer.
 *   - Request shape mismatch (JSON references a field protobuf doesn't
 *     know) → caught as a validation error before we hit the network.
 *   - Server-side gRPC error (`status` != 0) → resolved (not rejected)
 *     with `status` populated; lets the renderer render a structured
 *     error pane rather than a thrown.
 */
export async function invokeUnaryHost(args: InvokeUnaryHostArgs): Promise<InvokeUnaryRes> {
	const { endpoint, descriptor, service, method, requestJson, metadata, deadlineMs, projectFolder } = args;

	const { root } = await loadDescriptor(endpoint, descriptor, projectFolder);

	const svc = lookupServiceFlexibly(root, service);
	const rpc = svc.methods?.[method];
	if (!rpc) throw new Error(`Method ${method} not found on service ${service}`);
	rpc.resolve();

	if (rpc.requestStream || rpc.responseStream) {
		throw new Error(
			`${service}.${method} is a streaming method — only unary RPCs are wired up so far. Streaming support is on the roadmap.`,
		);
	}

	const requestType = rpc.resolvedRequestType;
	const responseType = rpc.resolvedResponseType;
	if (!requestType || !responseType) {
		throw new Error(`Could not resolve request / response types for ${service}.${method}`);
	}

	const requestObject = parseRequestJson(requestJson);
	const verifyError = requestType.verify(requestObject);
	if (verifyError) throw new Error(`Request body doesn't fit ${requestType.fullName}: ${verifyError}`);
	const requestMessage = requestType.fromObject(requestObject);

	const fqServiceName = stripLeadingDot(svc.fullName);
	const methodPath = `/${fqServiceName}/${method}`;

	const serialize = (value: object) => Buffer.from(requestType.encode(value).finish());
	const deserialize = (bytes: Buffer) => responseType.decode(bytes);

	return invokeWithFallback(endpoint, requestMessage, methodPath, serialize, deserialize, responseType, {
		metadata: metadata ?? {},
		deadlineMs: deadlineMs ?? DEFAULT_DEADLINE_MS,
	});
}

function parseRequestJson(requestJson: string): object {
	const trimmed = requestJson.trim();
	if (trimmed.length === 0) return {};
	try {
		const parsed = JSON.parse(trimmed);
		if (parsed === null || typeof parsed !== 'object') {
			throw new Error('Request JSON must be a JSON object');
		}
		return parsed as object;
	} catch (err) {
		throw new Error(`Could not parse request JSON: ${err instanceof Error ? err.message : String(err)}`);
	}
}

/**
 * Same TLS-with-plaintext-fallback dance as the discovery path. We keep
 * one helper here rather than sharing because the invocation call carries
 * extra state (metadata, response capture, error mapping) that doesn't
 * generalize cleanly to the discovery's "make one bidi roundtrip" shape.
 */
async function invokeWithFallback(
	endpoint: string,
	requestMessage: object,
	methodPath: string,
	serialize: (value: object) => Buffer,
	deserialize: (bytes: Buffer) => unknown,
	responseType: protobuf.Type,
	opts: { metadata: Record<string, string>; deadlineMs: number },
): Promise<InvokeUnaryRes> {
	const parsed = parseGrpcEndpoint(endpoint);
	const hasExplicitScheme = /^(grpc|grpcs|http|https):\/\//i.test(endpoint.trim());
	const attempts: boolean[] = [parsed.useTls];
	if (!hasExplicitScheme && parsed.useTls) attempts.push(false);

	let lastError: unknown = null;
	for (const useTls of attempts) {
		const credentials = useTls ? grpc.credentials.createSsl() : grpc.credentials.createInsecure();
		const client = new grpc.Client(parsed.address, credentials);
		try {
			const result = await singleUnaryCall(client, methodPath, serialize, deserialize, requestMessage, responseType, opts);
			client.close();
			return result;
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
	throw lastError instanceof Error ? lastError : new Error('Unary invocation failed');
}

function singleUnaryCall(
	client: grpc.Client,
	methodPath: string,
	serialize: (value: object) => Buffer,
	deserialize: (bytes: Buffer) => unknown,
	requestMessage: object,
	responseType: protobuf.Type,
	opts: { metadata: Record<string, string>; deadlineMs: number },
): Promise<InvokeUnaryRes> {
	return new Promise<InvokeUnaryRes>(resolve => {
		const metadata = new grpc.Metadata();
		for (const [k, v] of Object.entries(opts.metadata)) metadata.set(k, v);

		const start = Date.now();
		const trailerBuffer: Record<string, string> = {};

		const call = client.makeUnaryRequest(
			methodPath,
			serialize as never,
			deserialize as never,
			requestMessage as never,
			metadata,
			{ deadline: new Date(Date.now() + opts.deadlineMs) },
			(err, response) => {
				const durationMs = Date.now() - start;
				if (err) {
					// gRPC errors land here. We resolve (not reject) so the
					// renderer can display a structured error pane keyed on
					// status code — the call "completed", just unhappily.
					resolve({
						status: typeof err.code === 'number' ? err.code : 2 /* UNKNOWN */,
						statusMessage: err.message ?? 'gRPC error',
						responseJson: '',
						durationMs,
						trailers: trailerBuffer,
					});
					return;
				}
				try {
					const obj = responseType.toObject(response as never, {
						longs: String,
						enums: String,
						bytes: String,
						defaults: false,
					});
					resolve({
						status: 0,
						statusMessage: '',
						responseJson: JSON.stringify(obj),
						durationMs,
						trailers: trailerBuffer,
					});
				} catch (decodeErr) {
					resolve({
						status: 2,
						statusMessage: `Response decode failed: ${decodeErr instanceof Error ? decodeErr.message : String(decodeErr)}`,
						responseJson: '',
						durationMs,
						trailers: trailerBuffer,
					});
				}
			},
		);

		call.on('status', status => {
			// gRPC trailers live on the final status frame. We flatten metadata
			// to single-value strings — multi-value headers get joined with
			// `, ` rather than dropped so the renderer can still render them.
			const map = status.metadata.getMap();
			for (const key of Object.keys(map)) {
				const value = map[key];
				trailerBuffer[key] = Array.isArray(value) ? value.join(', ') : String(value);
			}
		});
	});
}

/**
 * Look up a service by name with two fallback strategies:
 *  1. `root.lookupService(name)` — exact FQ match.
 *  2. Walk every nested service in the root and match by `name` (the
 *     simple service name, not FQ). Lets the renderer pass either
 *     `HelloService` or `helloworld.HelloService` and have it work.
 */
function lookupServiceFlexibly(root: protobuf.Root, serviceName: string): protobuf.Service {
	try {
		return root.lookupService(serviceName);
	} catch {
		// fall through
	}
	const stack: protobuf.NamespaceBase[] = [root];
	while (stack.length > 0) {
		const node = stack.shift();
		if (!node) break;
		for (const child of node.nestedArray) {
			// A Service exposes a `methodsArray` field — duck-type instead of
			// importing the runtime type so this stays cheap to compile.
			if ((child as unknown as { methodsArray?: unknown[] }).methodsArray !== undefined) {
				const candidate = child as protobuf.Service;
				if (candidate.name === serviceName || stripLeadingDot(candidate.fullName) === serviceName) return candidate;
			}
			if ((child as protobuf.NamespaceBase).nestedArray) stack.push(child as protobuf.NamespaceBase);
		}
	}
	throw new Error(`Service ${serviceName} not found in descriptor`);
}

function stripLeadingDot(s: string): string {
	return s.startsWith('.') ? s.slice(1) : s;
}

function isLikelyTlsMismatch(err: unknown): boolean {
	if (!err || typeof err !== 'object') return false;
	const e = err as { code?: number; message?: string };
	const msg = String(e.message ?? '');
	if (e.code !== 14) return false;
	return /wrong version number/i.test(msg) || /SSL routines/i.test(msg) || /tls/i.test(msg) || /deadline/i.test(msg);
}
