/**
 * Per-flight registry of `ReadableStream<Uint8Array>` producers. When a
 * value resolves to `{ kind: 'stream', stream }`, the renderer registers
 * the underlying reader here under a generated streamId, then ships
 * `{ kind: 'stream', streamId, size?, contentType? }` over IPC to the
 * requester.
 *
 * The requester pulls chunks via `IpcStreamServiceMain.pull` (an
 * outbound message to the renderer). The renderer's pull handler walks
 * back into this registry, reads the next chunk, and replies via
 * `IpcStreamServiceRenderer.respondPull`.
 *
 * Cancellation is symmetric: a `Cancel` from the requester closes the
 * reader; a renderer-side abort tells the registry to evict, after which
 * any further `Pull` is answered with `done: true`.
 */

export interface StreamRegistration {
	stream: ReadableStream<Uint8Array>;
	size?: number;
	contentType?: string;
}

interface RegistryEntry {
	reader: ReadableStreamDefaultReader<Uint8Array>;
	size?: number;
	contentType?: string;
	cancelled: boolean;
}

export class StreamRegistry {
	private streams = new Map<string, RegistryEntry>();

	/**
	 * Register a `ReadableStream` under the given id. The id is opaque
	 * to the registry — callers pick a ksuid-derived value so it's
	 * stable across the flight's lifetime.
	 */
	register(streamId: string, registration: StreamRegistration): void {
		const reader = registration.stream.getReader();
		this.streams.set(streamId, {
			reader,
			size: registration.size,
			contentType: registration.contentType,
			cancelled: false,
		});
	}

	has(streamId: string): boolean {
		return this.streams.has(streamId);
	}

	/**
	 * Read the next chunk from the registered stream. Returns `done: true`
	 * for unknown / cancelled streams and on the natural end of stream.
	 */
	async pull(streamId: string): Promise<{ chunk?: Uint8Array; done: boolean }> {
		const entry = this.streams.get(streamId);
		if (!entry || entry.cancelled) return { done: true };

		const { value, done } = await entry.reader.read();
		if (done) {
			this.evict(streamId);
			return { done: true };
		}
		return { chunk: value, done: false };
	}

	/**
	 * Cancel a stream — releases the underlying reader and tells any
	 * future pulls to short-circuit. Safe to call multiple times.
	 *
	 * `reader.cancel()` internally releases the lock once the source
	 * teardown propagates, but until then the lock is held — making the
	 * release explicit ensures the underlying ReadableStream is
	 * GC-eligible immediately even if the cancel promise hasn't
	 * settled. `releaseLock()` throws when called on a locked-then-
	 * cancelled reader, hence the try/catch.
	 */
	cancel(streamId: string, reason?: unknown): void {
		const entry = this.streams.get(streamId);
		if (!entry) return;
		entry.cancelled = true;
		entry.reader.cancel(reason).catch(() => {});
		try {
			entry.reader.releaseLock();
		} catch {
			/* already released by cancel propagation */
		}
		this.streams.delete(streamId);
	}

	private evict(streamId: string): void {
		const entry = this.streams.get(streamId);
		if (!entry) return;
		try {
			entry.reader.releaseLock();
		} catch {
			/* already released */
		}
		this.streams.delete(streamId);
	}
}

/**
 * Singleton renderer-side registry. Lives in module scope — flights
 * across windows share the same renderer process, so a per-window
 * instance isn't needed (the per-flight `streamId` is the namespace).
 */
export const streamRegistry = new StreamRegistry();
