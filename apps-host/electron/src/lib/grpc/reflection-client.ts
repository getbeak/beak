import type {
	GrpcEnumDescriptor,
	GrpcMessageDescriptor,
	GrpcMessageField,
	GrpcMethodDescriptor,
	GrpcServiceDescriptor,
} from '@beak/common/ipc/grpc';
import * as grpc from '@grpc/grpc-js';
import type { Type as ProtobufType } from 'protobufjs';
import protobuf from 'protobufjs';
import descriptor from 'protobufjs/ext/descriptor';

import { parseGrpcEndpoint } from './endpoint';
import { REFLECTION_PROTO } from './reflection-proto';

/**
 * Hard-coded path on the gRPC channel for the reflection bidi stream. We
 * keep talking the `v1alpha` flavour because every reflection-enabled
 * server in the wild understands it; some only understand it. The wire
 * format is identical to `v1`.
 */
const REFLECTION_METHOD_PATH = '/grpc.reflection.v1alpha.ServerReflection/ServerReflectionInfo';

/**
 * Wall-clock cap on the whole discovery roundtrip. We pull one list-services
 * response and one file-descriptor response per discovered service —
 * usually 1–5 frames over 100ms locally, up to a second or two over the
 * public internet. 15s is comfortable for the slowest realistic remote
 * without making a misconfigured endpoint hang the renderer's button.
 */
const REFLECTION_TIMEOUT_MS = 15_000;

interface ParsedDescriptor {
	listResponse: ProtobufType;
	requestType: ProtobufType;
	responseType: ProtobufType;
}

let cached: ParsedDescriptor | null = null;

function getParsedReflectionProto(): ParsedDescriptor {
	if (cached) return cached;
	const root = protobuf.parse(REFLECTION_PROTO, { keepCase: false }).root;
	cached = {
		listResponse: root.lookupType('grpc.reflection.v1alpha.ListServiceResponse'),
		requestType: root.lookupType('grpc.reflection.v1alpha.ServerReflectionRequest'),
		responseType: root.lookupType('grpc.reflection.v1alpha.ServerReflectionResponse'),
	};
	return cached;
}

export interface ReflectionResult {
	services: GrpcServiceDescriptor[];
	messages: Record<string, GrpcMessageDescriptor>;
	enums: Record<string, GrpcEnumDescriptor>;
}

/**
 * Connect to `endpoint` over gRPC reflection and return the service +
 * method shape of every service the server advertises, plus every
 * message and enum reachable in the descriptor closure. Skips the
 * built-in `grpc.reflection.*` services in the result because they are
 * the machinery, not application surface.
 *
 * Connection strategy: when the parsed endpoint resolves to "probably
 * TLS" (the default for port-443 + non-localhost) we try TLS first; if
 * the channel can't get ready inside a short window we close and retry
 * plaintext. This matches what tools like Postman / Insomnia do — many
 * real-world public gRPC endpoints (notably `grpc.postman-echo.com:443`)
 * accept connections without TLS even on port 443, and users shouldn't
 * have to know that to make Discover work. Endpoints explicitly tagged
 * `grpc://` / `grpcs://` skip the fallback.
 *
 * Resolves with `services: []` when the server has no services exposed
 * (rare, but possible); rejects with the underlying gRPC status if no
 * connection strategy worked, the reflection stream errors, or the
 * deadline elapses.
 */
export async function discoverViaReflection(endpoint: string): Promise<ReflectionResult> {
	const parsed = parseGrpcEndpoint(endpoint);
	const hasExplicitScheme = /^(grpc|grpcs|http|https):\/\//i.test(endpoint.trim());

	const attempts: Array<{ useTls: boolean; reason: string }> = [];
	attempts.push({ useTls: parsed.useTls, reason: 'as configured' });
	if (!hasExplicitScheme && parsed.useTls) {
		// One fallback attempt only — preserves "TLS by default" while
		// rescuing the common plaintext-on-443 case.
		attempts.push({ useTls: false, reason: 'plaintext fallback' });
	}

	let lastError: unknown = null;
	for (const attempt of attempts) {
		const credentials = attempt.useTls ? grpc.credentials.createSsl() : grpc.credentials.createInsecure();
		const client = new grpc.Client(parsed.address, credentials);
		try {
			return await runDiscovery(client);
		} catch (err) {
			lastError = err;
			try {
				client.close();
			} catch {
				/* socket already closed */
			}
			if (!isLikelyTlsMismatch(err) || attempt === attempts[attempts.length - 1]) throw err;
			// Otherwise: continue to the next attempt.
		}
	}
	throw lastError instanceof Error ? lastError : new Error('Reflection failed for unknown reasons');
}

/**
 * Heuristic: distinguish a TLS-vs-plaintext mismatch from a "real" gRPC
 * failure (UNIMPLEMENTED, UNAVAILABLE because the server is down, etc.).
 * We only retry on errors that smell like a transport mismatch — anything
 * else propagates as-is so the user sees the actual problem.
 */
function isLikelyTlsMismatch(err: unknown): boolean {
	if (!err || typeof err !== 'object') return false;
	const e = err as { code?: number; message?: string };
	const msg = String(e.message ?? '');
	// gRPC code 14 = UNAVAILABLE — covers both "TLS handshake failed" and
	// "couldn't reach host". The message body is what disambiguates.
	if (e.code !== 14) return false;
	return /wrong version number/i.test(msg) || /SSL routines/i.test(msg) || /tls/i.test(msg) || /deadline/i.test(msg);
}

async function runDiscovery(client: grpc.Client): Promise<ReflectionResult> {
	try {
		const reflection = getParsedReflectionProto();

		const serialize = (value: unknown) =>
			Buffer.from(reflection.requestType.encode(reflection.requestType.fromObject(value as object)).finish());
		const deserialize = (buf: Buffer) => reflection.responseType.decode(buf).toJSON();

		const serviceNames = await callReflection<string[]>(
			client,
			serialize as never,
			deserialize as never,
			// Several real-world reflection servers (postman-echo among them)
			// only respond to `list_services: '*'` — empty string is accepted
			// by some implementations but silently dropped by others. `*` is
			// the safe form recommended by grpcurl and Buf's docs.
			{ listServices: '*' },
			response => {
				const body = response as Record<string, unknown>;
				if (body.errorResponse) {
					const err = body.errorResponse as { errorMessage?: string; errorCode?: number };
					throw new Error(`Reflection error ${err.errorCode ?? '?'}: ${err.errorMessage ?? 'no message'}`);
				}
				if (!body.listServicesResponse) return null;
				const list = body.listServicesResponse as { service?: Array<{ name?: string }> };
				return (list.service ?? [])
					.map(s => s.name)
					.filter((n): n is string => typeof n === 'string' && !n.startsWith('grpc.reflection.'))
					.sort();
			},
		);

		if (serviceNames.length === 0) return { services: [], messages: {}, enums: {} };

		const services: GrpcServiceDescriptor[] = [];
		// Accumulate every file we touch — we walk all of them once at the
		// end to pull message + enum schemas. Dedupe by file name so a
		// diamond import doesn't double-decode.
		const fileBytesByName = new Map<string, Uint8Array>();
		for (const name of serviceNames) {
			const fileDescriptors = await callReflection<Uint8Array[]>(
				client,
				serialize as never,
				deserialize as never,
				{ fileContainingSymbol: name },
				response => {
					const body = response as Record<string, unknown>;
					if (body.errorResponse) {
						const err = body.errorResponse as { errorMessage?: string; errorCode?: number };
						throw new Error(
							`Reflection error ${err.errorCode ?? '?'} on symbol ${name}: ${err.errorMessage ?? 'no message'}`,
						);
					}
					if (!body.fileDescriptorResponse) return null;
					const fdr = body.fileDescriptorResponse as { fileDescriptorProto?: string[] };
					// protobufjs JSON-encodes `bytes` as base64 strings.
					return (fdr.fileDescriptorProto ?? []).map(b64 => Uint8Array.from(Buffer.from(b64, 'base64')));
				},
			);

			const methods = extractMethodsForService(name, fileDescriptors);
			if (methods.length > 0) services.push({ name, methods });

			for (const bytes of fileDescriptors) {
				const decoded = decodeFileDescriptorProto(bytes);
				if (decoded.name && !fileBytesByName.has(decoded.name)) {
					fileBytesByName.set(decoded.name, bytes);
				}
			}
		}

		const { messages, enums } = extractTypesFromFiles(Array.from(fileBytesByName.values()));

		return { services, messages, enums };
	} finally {
		client.close();
	}
}

/**
 * Open a one-shot bidi stream against the reflection endpoint, send a single
 * request, collect responses until the server half-closes or we receive the
 * first response the caller accepts, then close the stream.
 *
 * The reflection protocol is conversational by design — each request gets a
 * response without us having to keep the stream open. We could use a long
 * stream and pipeline service queries, but the per-service overhead is
 * dominated by network latency, not stream setup; the simpler model is
 * easier to reason about for the discovery use case.
 */
function callReflection<T>(
	client: grpc.Client,
	serialize: (value: unknown) => Buffer,
	deserialize: (bytes: Buffer) => unknown,
	requestBody: Record<string, unknown>,
	pluck: (response: unknown) => T | null,
): Promise<T> {
	return new Promise<T>((resolve, reject) => {
		const deadline = new Date(Date.now() + REFLECTION_TIMEOUT_MS);
		const stream = client.makeBidiStreamRequest(REFLECTION_METHOD_PATH, serialize, deserialize, new grpc.Metadata(), {
			deadline,
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
		stream.on('error', (err: Error) => {
			settle(() => reject(err));
		});
		stream.on('end', () => {
			settle(() => reject(new Error('Reflection stream ended before producing a response')));
		});

		stream.write(requestBody);
	});
}

/**
 * Decode the FileDescriptorProto bytes returned by reflection and pull
 * out the methods declared on the named service.
 *
 * `fileContainingSymbol` returns every file in the symbol's transitive
 * closure — for a service that imports message types from another file,
 * we'll see multiple file descriptors. We walk all of them looking for
 * the named service in case the server packs files unpredictably.
 */
function extractMethodsForService(serviceName: string, fileDescriptors: Uint8Array[]): GrpcMethodDescriptor[] {
	for (const bytes of fileDescriptors) {
		const fd = (
			descriptor as unknown as {
				FileDescriptorProto: { decode: (buf: Uint8Array) => unknown };
			}
		).FileDescriptorProto.decode(bytes) as FileDescriptorProtoShape;

		const pkg = fd.package ?? '';
		for (const svc of fd.service ?? []) {
			const fqName = pkg ? `${pkg}.${svc.name}` : svc.name;
			if (fqName !== serviceName) continue;
			return (svc.method ?? []).map(m => ({
				name: m.name,
				requestType: stripLeadingDot(m.inputType),
				responseType: stripLeadingDot(m.outputType),
				requestStream: Boolean(m.clientStreaming),
				responseStream: Boolean(m.serverStreaming),
			}));
		}
	}
	return [];
}

function stripLeadingDot(s: string): string {
	return s.startsWith('.') ? s.slice(1) : s;
}

interface FileDescriptorProtoShape {
	name?: string;
	package?: string;
	service?: Array<{
		name: string;
		method?: Array<{
			name: string;
			inputType: string;
			outputType: string;
			clientStreaming?: boolean;
			serverStreaming?: boolean;
		}>;
	}>;
	messageType?: DescriptorProtoShape[];
	enumType?: EnumDescriptorProtoShape[];
}

interface DescriptorProtoShape {
	name: string;
	field?: FieldDescriptorProtoShape[];
	nestedType?: DescriptorProtoShape[];
	enumType?: EnumDescriptorProtoShape[];
	oneofDecl?: Array<{ name: string }>;
}

interface FieldDescriptorProtoShape {
	name: string;
	number: number;
	/** Numeric FieldDescriptorProto.Type — protobufjs gives us the name string. */
	type: string;
	/** Numeric FieldDescriptorProto.Label — protobufjs decodes 'LABEL_REPEATED' etc. */
	label: string;
	typeName?: string;
	oneofIndex?: number;
	proto3Optional?: boolean;
}

interface EnumDescriptorProtoShape {
	name: string;
	value?: Array<{ name: string; number: number }>;
}

function decodeFileDescriptorProto(bytes: Uint8Array): FileDescriptorProtoShape {
	return (
		descriptor as unknown as {
			FileDescriptorProto: { decode: (buf: Uint8Array) => unknown };
		}
	).FileDescriptorProto.decode(bytes) as FileDescriptorProtoShape;
}

/**
 * Walk every FileDescriptorProto, pulling out flat maps of FQ message
 * name → field shape and FQ enum name → values. Nested types are
 * promoted to top-level entries keyed by their full path
 * (`outer.Inner.Deepest`) so the renderer can resolve any reference by
 * FQ name without recursing.
 */
function extractTypesFromFiles(fileBytes: Uint8Array[]): {
	messages: Record<string, GrpcMessageDescriptor>;
	enums: Record<string, GrpcEnumDescriptor>;
} {
	const messages: Record<string, GrpcMessageDescriptor> = {};
	const enums: Record<string, GrpcEnumDescriptor> = {};

	for (const bytes of fileBytes) {
		const fd = decodeFileDescriptorProto(bytes);
		const pkg = fd.package ?? '';
		for (const message of fd.messageType ?? []) {
			collectMessages(pkg, message, messages, enums);
		}
		for (const enumType of fd.enumType ?? []) {
			collectEnum(pkg, enumType, enums);
		}
	}
	return { messages, enums };
}

function collectMessages(
	parentPath: string,
	message: DescriptorProtoShape,
	messages: Record<string, GrpcMessageDescriptor>,
	enums: Record<string, GrpcEnumDescriptor>,
): void {
	const fqName = parentPath ? `${parentPath}.${message.name}` : message.name;
	const oneofs = (message.oneofDecl ?? []).map(o => o.name);
	const fields: GrpcMessageField[] = (message.field ?? []).map(f => projectField(f));
	messages[fqName] = { name: fqName, fields, oneofs };

	for (const nested of message.nestedType ?? []) {
		collectMessages(fqName, nested, messages, enums);
	}
	for (const nestedEnum of message.enumType ?? []) {
		collectEnum(fqName, nestedEnum, enums);
	}
}

function collectEnum(
	parentPath: string,
	enumType: EnumDescriptorProtoShape,
	enums: Record<string, GrpcEnumDescriptor>,
): void {
	const fqName = parentPath ? `${parentPath}.${enumType.name}` : enumType.name;
	enums[fqName] = {
		name: fqName,
		values: (enumType.value ?? []).map(v => ({ name: v.name, number: v.number })),
	};
}

/**
 * Flatten a `FieldDescriptorProto` into the renderer-friendly shape.
 * protobufjs decodes `type` and `label` as their enum *name* strings
 * (`TYPE_STRING`, `LABEL_REPEATED`, …) — we normalise to lowercase
 * tokens without the prefix so the renderer can `switch` on them
 * without leaking the proto enum vocabulary.
 */
function projectField(field: FieldDescriptorProtoShape): GrpcMessageField {
	const rawType = (field.type ?? '').toString();
	const typeToken = rawType.startsWith('TYPE_') ? rawType.slice(5).toLowerCase() : rawType.toLowerCase();
	const rawLabel = (field.label ?? '').toString();
	const repeated = rawLabel === 'LABEL_REPEATED';
	return {
		name: field.name,
		number: field.number,
		type: typeToken,
		typeName: stripLeadingDot(field.typeName ?? ''),
		repeated,
		// proto3 optional is signalled by both `proto3Optional` and an
		// implicit oneof in the descriptor — we surface the former so the
		// renderer can render a "clear" affordance distinct from "default".
		optional: Boolean(field.proto3Optional),
		...(typeof field.oneofIndex === 'number' && !field.proto3Optional ? { oneofIndex: field.oneofIndex } : {}),
	};
}
