import path from 'node:path';

import {
	type DiscoverMethodsReq,
	type DiscoverMethodsRes,
	type GrpcEnumDescriptor,
	type GrpcMessageDescriptor,
	type GrpcServiceDescriptor,
	type InvokeUnaryReq,
	type InvokeUnaryRes,
	IpcGrpcServiceMain,
} from '@beak/common/ipc/grpc';
import * as protoLoader from '@grpc/proto-loader';
import { type IpcMainInvokeEvent, ipcMain } from 'electron';

import { discoverViaReflection } from '../lib/grpc/reflection-client';
import { invokeUnaryHost } from '../lib/grpc/unary-invoker';
import { ensureWithinProject } from './fs-service';
import { getProjectFilePathWindowMapping } from './fs-shared';

const service = new IpcGrpcServiceMain(ipcMain);

service.registerDiscoverMethods(async (event, payload: DiscoverMethodsReq): Promise<DiscoverMethodsRes> => {
	const { endpoint, descriptor } = payload;

	let services: GrpcServiceDescriptor[];
	let messages: Record<string, GrpcMessageDescriptor> = {};
	let enums: Record<string, GrpcEnumDescriptor> = {};
	switch (descriptor.type) {
		case 'reflection': {
			const result = await discoverViaReflection(endpoint);
			services = result.services;
			messages = result.messages;
			enums = result.enums;
			break;
		}

		case 'proto': {
			// Resolve the proto path inside the open project so a hostile
			// renderer can't make us load arbitrary files on disk. Same
			// pattern as every other fs-touching IPC handler.
			const projectFolder = getProjectFilePathWindowMapping(event as unknown as IpcMainInvokeEvent);
			const protoPath = await ensureWithinProject(projectFolder, descriptor.path);
			const result = await discoverViaProto(protoPath);
			services = result.services;
			messages = result.messages;
			enums = result.enums;
			break;
		}

		case 'buf':
			// BSR fetch is a follow-up — the discriminator is here so the
			// renderer's "Discover" call still lands cleanly and gets a
			// telling error rather than a 500 from a missing handler.
			throw new Error(
				'Buf Schema Registry descriptors are not yet wired up — use reflection or a local proto file for now.',
			);
	}

	return {
		services,
		messages,
		enums,
		discoveredAt: new Date().toISOString(),
	};
});

service.registerInvokeUnary(async (event, payload: InvokeUnaryReq): Promise<InvokeUnaryRes> => {
	const projectFolder = getProjectFilePathWindowMapping(event as unknown as IpcMainInvokeEvent);
	const folderForLoader = projectFolder ? path.dirname(projectFolder) : null;

	// For proto-file descriptors, the loader walks include paths relative to
	// the file. We re-run `ensureWithinProject` here so a hostile renderer
	// can't escape the project root via a tampered descriptor.
	if (payload.descriptor.type === 'proto' && projectFolder) {
		await ensureWithinProject(projectFolder, payload.descriptor.path);
	}

	return invokeUnaryHost({
		endpoint: payload.endpoint,
		descriptor: payload.descriptor,
		service: payload.service,
		method: payload.method,
		requestJson: payload.requestJson,
		metadata: payload.metadata,
		deadlineMs: payload.deadlineMs,
		projectFolder: folderForLoader,
	});
});

/**
 * Load + parse a local `.proto` file using `@grpc/proto-loader` and
 * project the result into the renderer's `GrpcServiceDescriptor`.
 *
 * The renderer needs message + enum descriptors for the Fields editor, but
 * `proto-loader` only surfaces them as half-typed runtime objects. For
 * proto-file sources we currently return empty message / enum maps and
 * leave the Fields editor in raw-JSON mode — fleshing this out means
 * walking proto-loader's `Message` / `Enum` types into our flat form. The
 * IPC shape is stable, so this is a fill-in not a contract change.
 */
async function discoverViaProto(protoPath: string): Promise<{
	services: GrpcServiceDescriptor[];
	messages: Record<string, GrpcMessageDescriptor>;
	enums: Record<string, GrpcEnumDescriptor>;
}> {
	const pkg = await protoLoader.load(protoPath, {
		keepCase: false,
		longs: String,
		enums: String,
		defaults: true,
		oneofs: true,
		includeDirs: [path.dirname(protoPath)],
	});

	const services: GrpcServiceDescriptor[] = [];
	for (const [fqName, definition] of Object.entries(pkg)) {
		// Method-bag entries have method records keyed by RPC name; message
		// entries don't. The proto-loader output isn't tightly typed, so
		// we duck-type on `requestType` (always present on RPC methods).
		const maybeMethods = definition as Record<string, unknown>;
		const methods = [];
		for (const [methodName, methodInfo] of Object.entries(maybeMethods)) {
			if (!methodInfo || typeof methodInfo !== 'object') continue;
			const info = methodInfo as {
				requestType?: { type?: { name?: string } };
				responseType?: { type?: { name?: string } };
				requestStream?: boolean;
				responseStream?: boolean;
			};
			if (!info.requestType?.type?.name || !info.responseType?.type?.name) continue;
			methods.push({
				name: methodName,
				requestType: info.requestType.type.name,
				responseType: info.responseType.type.name,
				requestStream: Boolean(info.requestStream),
				responseStream: Boolean(info.responseStream),
			});
		}
		if (methods.length > 0) services.push({ name: fqName, methods });
	}

	return {
		services: services.sort((a, b) => a.name.localeCompare(b.name)),
		messages: {},
		enums: {},
	};
}
