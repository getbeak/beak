import { z } from 'zod';

import type { PartialIpcMain } from './main';
import { IpcServiceMain } from './main';
import type { PartialIpcRenderer } from './renderer';
import { IpcServiceRenderer } from './renderer';
import type { IpcListener } from './types';

/**
 * gRPC service discovery & invocation surface. Today this exposes
 * `discoverMethods` (server reflection + proto-file parsing on the host).
 * Method invocation will land alongside this when the request editor for
 * gRPC is wired — keeping the IPC contract here means the renderer service
 * boundary stays stable as features fill in.
 *
 * The host validates payloads with Zod at the boundary; the renderer is
 * treated as untrusted (it runs extension code).
 */

/** Descriptor strategy is mirrored from `_collection.json`'s gRPC source. */
const descriptorSchema = z.discriminatedUnion('type', [
	z.object({ type: z.literal('reflection') }).strict(),
	z.object({ type: z.literal('proto'), path: z.string().min(1) }).strict(),
	z.object({ type: z.literal('buf'), module: z.string().min(1) }).strict(),
]);

const discoverMethodsSchema = z.object({
	endpoint: z.string().min(1),
	descriptor: descriptorSchema,
	/** When true, host should bypass cached results. Defaults to false. */
	force: z.boolean().optional(),
});

const invokeUnarySchema = z.object({
	endpoint: z.string().min(1),
	descriptor: descriptorSchema,
	/** Fully-qualified service name, e.g. `HelloService` or `echo.EchoService`. */
	service: z.string().min(1),
	/** Method name on that service, e.g. `SayHello`. */
	method: z.string().min(1),
	/** JSON-encoded request message. The host parses with protobufjs's JSON form. */
	requestJson: z.string(),
	/** Optional request-scope metadata, sent as gRPC trailers/headers. */
	metadata: z.record(z.string(), z.string()).optional(),
	/** Deadline in milliseconds from now. Capped server-side. */
	deadlineMs: z.number().int().positive().optional(),
});

export const GrpcMessages = {
	DiscoverMethods: 'discover_methods',
	InvokeUnary: 'invoke_unary',
} as const;

export type GrpcDescriptorIpc = z.infer<typeof descriptorSchema>;

export interface DiscoverMethodsReq {
	endpoint: string;
	descriptor: GrpcDescriptorIpc;
	force?: boolean;
}

/**
 * One method on a gRPC service. Streaming flags drive the renderer's
 * request editor (unary, server-stream, client-stream, bidi) — the
 * invocation surface for non-unary methods is deferred but the shape
 * already carries the info so we don't have to migrate persisted data
 * later.
 */
export interface GrpcMethodDescriptor {
	name: string;
	/** Fully-qualified protobuf message type, e.g. `echo.EchoRequest`. */
	requestType: string;
	responseType: string;
	requestStream: boolean;
	responseStream: boolean;
}

export interface GrpcServiceDescriptor {
	/** Fully-qualified service name, e.g. `echo.EchoService`. */
	name: string;
	methods: GrpcMethodDescriptor[];
}

/**
 * One field on a protobuf message — flattened from FileDescriptorProto's
 * FieldDescriptorProto so the renderer can build inputs without depending
 * on protobufjs. Includes everything the Fields editor needs: the wire
 * type, repeatedness, optional/oneof grouping, and (for message / enum
 * fields) the referenced type's FQ name.
 */
export interface GrpcMessageField {
	name: string;
	number: number;
	/** Lowercase proto type — 'string', 'int32', 'bool', 'message', 'enum', etc. */
	type: string;
	/** For 'message' / 'enum' fields, the FQ type name. Empty for primitives. */
	typeName: string;
	repeated: boolean;
	/** True when the field was declared with `optional` in proto3. */
	optional: boolean;
	/** When the field belongs to a `oneof`, the index of that oneof in the message. */
	oneofIndex?: number;
}

export interface GrpcMessageDescriptor {
	name: string;
	fields: GrpcMessageField[];
	/** Ordered list of `oneof` names (referenced from fields' `oneofIndex`). */
	oneofs: string[];
}

export interface GrpcEnumDescriptor {
	name: string;
	values: Array<{ name: string; number: number }>;
}

export interface DiscoverMethodsRes {
	services: GrpcServiceDescriptor[];
	/**
	 * Map of FQ message name → message descriptor. Includes every message
	 * reachable from any service's methods (request + response transitively)
	 * so the Fields editor can resolve nested types without re-querying.
	 */
	messages: Record<string, GrpcMessageDescriptor>;
	/** Map of FQ enum name → enum descriptor. */
	enums: Record<string, GrpcEnumDescriptor>;
	/** ISO 8601 timestamp the host completed discovery; persisted into the collection. */
	discoveredAt: string;
}

export interface InvokeUnaryReq {
	endpoint: string;
	descriptor: GrpcDescriptorIpc;
	service: string;
	method: string;
	requestJson: string;
	metadata?: Record<string, string>;
	deadlineMs?: number;
}

export interface InvokeUnaryRes {
	/** gRPC status code (0 = OK). See `grpc.status` for the standard codes. */
	status: number;
	/** Status message; empty on success, populated on error. */
	statusMessage: string;
	/** Response message as JSON. Empty when the call failed. */
	responseJson: string;
	/** Wall-clock latency, host-side. */
	durationMs: number;
	/** Response metadata (`trailers`). Lowercase keys, single string per key (joined when multi-valued). */
	trailers: Record<string, string>;
}

export class IpcGrpcServiceRenderer extends IpcServiceRenderer<'grpc'> {
	constructor(ipc: PartialIpcRenderer) {
		super('grpc', ipc);
	}

	async discoverMethods(payload: DiscoverMethodsReq) {
		return this.invoke<DiscoverMethodsRes>(GrpcMessages.DiscoverMethods, payload);
	}

	async invokeUnary(payload: InvokeUnaryReq) {
		return this.invoke<InvokeUnaryRes>(GrpcMessages.InvokeUnary, payload);
	}
}

export class IpcGrpcServiceMain extends IpcServiceMain<'grpc'> {
	constructor(ipc: PartialIpcMain) {
		super('grpc', ipc);
	}

	registerDiscoverMethods(fn: IpcListener<DiscoverMethodsReq>) {
		this.registerRequestHandler(GrpcMessages.DiscoverMethods, fn, discoverMethodsSchema as never);
	}

	registerInvokeUnary(fn: IpcListener<InvokeUnaryReq>) {
		this.registerRequestHandler(GrpcMessages.InvokeUnary, fn, invokeUnarySchema as never);
	}
}
