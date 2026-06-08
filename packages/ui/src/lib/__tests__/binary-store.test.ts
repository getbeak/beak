import { describe, expect, it } from 'vitest';

import binaryStore from '../binary-store';

async function readAll(stream: ReadableStream<Uint8Array>): Promise<Uint8Array> {
	const reader = stream.getReader();
	const chunks: Uint8Array[] = [];
	let total = 0;
	while (true) {
		const { value, done } = await reader.read();
		if (done) break;
		chunks.push(value);
		total += value.byteLength;
	}
	const out = new Uint8Array(total);
	let offset = 0;
	for (const c of chunks) {
		out.set(c, offset);
		offset += c.byteLength;
	}
	return out;
}

describe('binaryStore basic flow', () => {
	it('create + append + get round-trip the buffer', () => {
		const key = 'a';
		binaryStore.create(key);
		binaryStore.append(key, new Uint8Array([1, 2]));
		binaryStore.append(key, new Uint8Array([3]));
		expect(Array.from(binaryStore.get(key))).toEqual([1, 2, 3]);
		binaryStore.remove(key);
	});

	it('exists() reflects create / remove', () => {
		const key = 'exists-1';
		expect(binaryStore.exists(key)).toBe(false);
		binaryStore.create(key);
		expect(binaryStore.exists(key)).toBe(true);
		binaryStore.remove(key);
		expect(binaryStore.exists(key)).toBe(false);
	});

	it('get() materialises across many chunks correctly', () => {
		const key = 'multi-chunk';
		binaryStore.create(key);
		const expected: number[] = [];
		for (let i = 0; i < 100; i++) {
			const chunk = new Uint8Array([i, i + 1]);
			binaryStore.append(key, chunk);
			expected.push(i, i + 1);
		}
		expect(Array.from(binaryStore.get(key))).toEqual(expected);
		binaryStore.remove(key);
	});

	it('set() replaces the buffer and notifies live subscribers', async () => {
		const key = 'set-1';
		binaryStore.create(key);
		binaryStore.append(key, new Uint8Array([1, 2, 3]));

		const reader = binaryStore.subscribe(key).getReader();
		// Drain the replay so we observe the next chunk fresh.
		await reader.read();

		binaryStore.set(key, new Uint8Array([9, 9]));
		const next = await reader.read();
		expect(next.value).toEqual(new Uint8Array([9, 9]));
		expect(Array.from(binaryStore.get(key))).toEqual([9, 9]);

		binaryStore.complete(key);
		binaryStore.remove(key);
	});

	it('get() on a never-created key returns an empty buffer', () => {
		expect(binaryStore.get('never-created')).toEqual(new Uint8Array(0));
	});

	it('append on a missing key throws (callers must create first)', () => {
		expect(() => binaryStore.append('not-there', new Uint8Array([1]))).toThrow(/doesn't exist/);
	});
});

describe('binaryStore.subscribe', () => {
	it('replays buffered bytes and then yields live chunks', async () => {
		const key = 'live-1';
		binaryStore.create(key);
		binaryStore.append(key, new Uint8Array([1, 2, 3]));

		const stream = binaryStore.subscribe(key);
		const reader = stream.getReader();

		const first = await reader.read();
		expect(first.value).toEqual(new Uint8Array([1, 2, 3]));

		binaryStore.append(key, new Uint8Array([4]));
		const second = await reader.read();
		expect(second.value).toEqual(new Uint8Array([4]));

		binaryStore.complete(key);
		const last = await reader.read();
		expect(last.done).toBe(true);

		binaryStore.remove(key);
	});

	it('closes the stream when complete() runs before subscribe', async () => {
		const key = 'pre-complete';
		binaryStore.create(key);
		binaryStore.append(key, new Uint8Array([9]));
		binaryStore.complete(key);

		const stream = binaryStore.subscribe(key);
		const bytes = await readAll(stream);
		expect(bytes).toEqual(new Uint8Array([9]));

		binaryStore.remove(key);
	});

	it('cancel() drops the subscriber so further appends are silent for it', async () => {
		const key = 'cancel-1';
		binaryStore.create(key);
		const stream = binaryStore.subscribe(key);
		const reader = stream.getReader();
		await reader.cancel();

		// No subscribers listening — appending shouldn't throw.
		expect(() => binaryStore.append(key, new Uint8Array([7]))).not.toThrow();
		binaryStore.remove(key);
	});

	it('supports multiple concurrent subscribers', async () => {
		const key = 'fan-out';
		binaryStore.create(key);
		const a = binaryStore.subscribe(key);
		const b = binaryStore.subscribe(key);

		const aReader = a.getReader();
		const bReader = b.getReader();

		binaryStore.append(key, new Uint8Array([11, 12]));

		const aFirst = await aReader.read();
		const bFirst = await bReader.read();
		expect(aFirst.value).toEqual(new Uint8Array([11, 12]));
		expect(bFirst.value).toEqual(new Uint8Array([11, 12]));

		binaryStore.complete(key);
		binaryStore.remove(key);
	});
});
