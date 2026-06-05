import { type DiscoverMethodsReq, type InvokeUnaryReq, IpcGrpcServiceMain } from '@beak/common/ipc/grpc';

import { webIpcMain } from './ipc';

/**
 * gRPC isn't reachable from a sandboxed browser context — no raw HTTP/2,
 * no TCP, no access to the system TLS stack. The path forward in the web
 * shell is gRPC-Web (which needs a proxy in front of the gRPC server),
 * not transparent gRPC. Until that's wired we still register the handlers
 * so the renderer's `invoke('grpc', ...)` doesn't hit the "Channel grpc
 * has no listeners" cliff — instead it gets a focused error that the
 * sync-failed alert pipeline surfaces.
 */
const service = new IpcGrpcServiceMain(webIpcMain);

const NOT_AVAILABLE_MESSAGE =
	"gRPC isn't available in the web shell — browsers can't speak HTTP/2 directly. Run Beak as a desktop app, or wire your service behind a gRPC-Web proxy (this is on the roadmap).";

service.registerDiscoverMethods(async (_event, _payload: DiscoverMethodsReq) => {
	throw new Error(NOT_AVAILABLE_MESSAGE);
});

service.registerInvokeUnary(async (_event, _payload: InvokeUnaryReq) => {
	throw new Error(NOT_AVAILABLE_MESSAGE);
});
