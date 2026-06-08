interface SubscriberController {
	controller: ReadableStreamDefaultController<Uint8Array>;
	closed: boolean;
}

interface BinaryEntry {
	/**
	 * Chunks accumulated so far. Stored as separate `Uint8Array`s and
	 * only concatenated on `get()` — a streamed response can land
	 * hundreds of small chunks, and the legacy "concat on every append"
	 * shape was O(n²). Live subscribers receive each chunk directly so
	 * they don't pay the concatenation cost either.
	 */
	chunks: Uint8Array[];
	totalSize: number;
	completed: boolean;
	subscribers: Set<SubscriberController>;
}

/**
 * In-memory store of binary blobs keyed by `binaryStoreKey`. Response
 * heartbeats append chunks; the response pane reads `get(key)` for the
 * final bytes.
 *
 * Subscribers (ADR-0007 §5) get a `ReadableStream<Uint8Array>` that:
 *   1. Replays any chunks already buffered at the moment of subscribe.
 *   2. Streams new chunks live as `append(key, buf)` calls land.
 *   3. Closes when `complete(key)` is called.
 *
 * The same store powers two readers — the "wait for the whole body"
 * path (legacy text/json response RTVs) and the "feed it forward live"
 * path (the new `response_body_stream` RTV) — without buffering twice.
 */
class BinaryStore {
	private _store: Record<string, BinaryEntry> = {};

	create(key: string, buf?: Uint8Array) {
		this._store[key] = {
			chunks: buf && buf.length > 0 ? [buf] : [],
			totalSize: buf?.length ?? 0,
			completed: false,
			subscribers: new Set(),
		};
	}

	exists(key: string) {
		return key in this._store;
	}

	get(key: string): Uint8Array {
		const entry = this._store[key];
		if (!entry || entry.totalSize === 0) return new Uint8Array(0);
		if (entry.chunks.length === 1) return entry.chunks[0];
		// Materialise on read. The flat buffer isn't memoised because the
		// chunks array can grow between calls (response still in flight).
		const out = new Uint8Array(entry.totalSize);
		let offset = 0;
		for (const c of entry.chunks) {
			out.set(c, offset);
			offset += c.byteLength;
		}
		return out;
	}

	/**
	 * Replace the buffer with a single chunk. Used by callers that have
	 * the full bytes in hand; preserves the "many subscribers see the
	 * same bytes" semantic by emitting the chunk to live subscribers.
	 */
	set(key: string, buf: Uint8Array) {
		const entry = this._ensure(key);
		entry.chunks = buf.length > 0 ? [buf] : [];
		entry.totalSize = buf.length;
		for (const sub of entry.subscribers) {
			if (sub.closed) continue;
			try {
				sub.controller.enqueue(buf);
			} catch {
				sub.closed = true;
			}
		}
	}

	append(key: string, buf: Uint8Array) {
		const entry = this._ensure(key);
		if (buf.length > 0) {
			entry.chunks.push(buf);
			entry.totalSize += buf.length;
		}
		for (const sub of entry.subscribers) {
			if (sub.closed) continue;
			try {
				sub.controller.enqueue(buf);
			} catch {
				sub.closed = true;
			}
		}
	}

	/**
	 * Mark a key complete — subsequent subscribers see the full buffer
	 * and close immediately; live subscribers receive a `close()`.
	 */
	complete(key: string) {
		const entry = this._store[key];
		if (!entry) return;
		entry.completed = true;
		for (const sub of entry.subscribers) {
			if (sub.closed) continue;
			try {
				sub.controller.close();
			} catch {
				/* already closed */
			}
			sub.closed = true;
		}
		entry.subscribers.clear();
	}

	/**
	 * Open a live `ReadableStream` against this key. Buffered chunks
	 * replay immediately; live chunks land as they arrive; the stream
	 * closes on {@link complete}.
	 */
	subscribe(key: string): ReadableStream<Uint8Array> {
		const entry = this._ensure(key);
		let registered: SubscriberController | null = null;
		// eslint-disable-next-line @typescript-eslint/no-this-alias -- needed for cancel callback
		const store = this;
		return new ReadableStream<Uint8Array>({
			start(controller) {
				for (const c of entry.chunks) controller.enqueue(c);
				if (entry.completed) {
					controller.close();
					return;
				}
				registered = { controller, closed: false };
				entry.subscribers.add(registered);
			},
			cancel() {
				if (!registered) return;
				registered.closed = true;
				const e = store._store[key];
				if (e) e.subscribers.delete(registered);
			},
		});
	}

	remove(key: string) {
		const entry = this._store[key];
		if (entry) {
			for (const sub of entry.subscribers) {
				sub.closed = true;
				try {
					sub.controller.close();
				} catch {
					/* noop */
				}
			}
		}
		delete this._store[key];
	}

	private _ensure(key: string): BinaryEntry {
		if (!this.exists(key)) throw new Error(`binary store for ${key} doesn't exist`);
		return this._store[key];
	}
}

const binaryStore = new BinaryStore();

export default binaryStore;
