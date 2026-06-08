import { describe, expect, it } from 'vitest';

import { StreamRegistry } from '../registry';

function makeStream(chunks: Uint8Array[]): ReadableStream<Uint8Array> {
	let i = 0;
	return new ReadableStream<Uint8Array>({
		pull(controller) {
			if (i < chunks.length) {
				controller.enqueue(chunks[i++]);
			} else {
				controller.close();
			}
		},
	});
}

describe('StreamRegistry', () => {
	it('pulls chunks in order until the source completes', async () => {
		const registry = new StreamRegistry();
		const stream = makeStream([new Uint8Array([1, 2]), new Uint8Array([3, 4, 5])]);
		registry.register('s1', { stream });

		const first = await registry.pull('s1');
		expect(first).toEqual({ done: false, chunk: new Uint8Array([1, 2]) });

		const second = await registry.pull('s1');
		expect(second).toEqual({ done: false, chunk: new Uint8Array([3, 4, 5]) });

		const last = await registry.pull('s1');
		expect(last).toEqual({ done: true });
	});

	it('returns done immediately for unknown streamIds', async () => {
		const registry = new StreamRegistry();
		expect(await registry.pull('not-there')).toEqual({ done: true });
	});

	it('cancel evicts the stream and short-circuits subsequent pulls', async () => {
		const registry = new StreamRegistry();
		const stream = makeStream([new Uint8Array([1]), new Uint8Array([2])]);
		registry.register('s2', { stream });

		expect(await registry.pull('s2')).toMatchObject({ done: false });
		registry.cancel('s2');
		expect(registry.has('s2')).toBe(false);
		expect(await registry.pull('s2')).toEqual({ done: true });
	});

	it('reports size + contentType on register but does not require them', () => {
		const registry = new StreamRegistry();
		registry.register('s3', { stream: makeStream([]), size: 42, contentType: 'image/png' });
		registry.register('s4', { stream: makeStream([]) });
		expect(registry.has('s3')).toBe(true);
		expect(registry.has('s4')).toBe(true);
	});

	it('cancel on an unknown id is a no-op', () => {
		const registry = new StreamRegistry();
		expect(() => registry.cancel('ghost')).not.toThrow();
	});

	it('cancel mid-stream — subsequent pulls return done immediately', async () => {
		const registry = new StreamRegistry();
		const stream = makeStream([new Uint8Array([1, 2]), new Uint8Array([3, 4]), new Uint8Array([5, 6])]);
		registry.register('mid', { stream });

		expect(await registry.pull('mid')).toMatchObject({ done: false });
		registry.cancel('mid');
		expect(await registry.pull('mid')).toEqual({ done: true });
		expect(await registry.pull('mid')).toEqual({ done: true });
	});

	it('a source-side error propagates to pull as a rejected promise', async () => {
		const registry = new StreamRegistry();
		let pullCount = 0;
		const stream = new ReadableStream<Uint8Array>({
			pull(controller) {
				pullCount++;
				if (pullCount === 1) {
					controller.enqueue(new Uint8Array([1]));
					return;
				}
				controller.error(new Error('upstream failed'));
			},
		});
		registry.register('errs', { stream });

		// First read returns the chunk; second surfaces the error.
		expect(await registry.pull('errs')).toMatchObject({ done: false });
		await expect(registry.pull('errs')).rejects.toThrow('upstream failed');
	});
});
