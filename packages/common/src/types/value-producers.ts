import type { AssetRef } from './asset-ref';

/**
 * The shape the requester sees for any binary value on the wire — a body
 * file, a multipart binary part, or a streaming upload. Replaces the
 * `__hacky__binaryFileData: Uint8Array` field that the renderer used to
 * pre-materialise.
 *
 * - `inline` — bytes the renderer already had in hand. Crosses IPC as a
 *   `Uint8Array` (Electron's structured-clone path). No size threshold
 *   is enforced today; callers should not route GB-scale buffers through
 *   this variant — use `stream` for large payloads.
 * - `asset` — content-addressed pointer. The requester reads
 *   `<projectFolder>/_assets/<sha-prefix>/<sha>` directly from disk and
 *   never touches the renderer for these bytes.
 * - `stream` — opaque handle into a per-flight stream registry. The
 *   requester pulls chunks from the renderer over `IpcStreamService`
 *   with backpressure and writes them into the outgoing request body.
 */
export type ValueProducerHandle =
	| { kind: 'inline'; bytes: Uint8Array; contentType?: string }
	| { kind: 'asset'; ref: AssetRef }
	| { kind: 'stream'; streamId: string; size?: number; contentType?: string };
