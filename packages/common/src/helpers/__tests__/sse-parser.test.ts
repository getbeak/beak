import { describe, expect, it } from 'vitest';

import { SseParser, isSseContentType } from '../sse-parser';

function encode(str: string): Uint8Array {
	return new TextEncoder().encode(str);
}

describe('SseParser', () => {
	it('parses a single complete event terminated by a blank line', () => {
		const parser = new SseParser();
		const events = parser.push(encode('data: hello world\n\n'));
		expect(events).toHaveLength(1);
		expect(events[0].data).toBe('hello world');
		expect(events[0].event).toBeUndefined();
		expect(events[0].id).toBeUndefined();
	});

	it('concatenates multiple data lines with a newline separator', () => {
		const parser = new SseParser();
		const events = parser.push(encode('data: line one\ndata: line two\ndata: line three\n\n'));
		expect(events).toHaveLength(1);
		expect(events[0].data).toBe('line one\nline two\nline three');
	});

	it('captures event/id/retry fields', () => {
		const parser = new SseParser();
		const events = parser.push(encode('event: ping\nid: 42\nretry: 5000\ndata: pong\n\n'));
		expect(events).toHaveLength(1);
		expect(events[0].event).toBe('ping');
		expect(events[0].id).toBe('42');
		expect(events[0].retry).toBe(5000);
		expect(events[0].data).toBe('pong');
	});

	it('handles events that span multiple feed() calls', () => {
		const parser = new SseParser();
		expect(parser.push(encode('data: hel'))).toEqual([]);
		expect(parser.push(encode('lo\n\nda'))).toHaveLength(1);
		expect(parser.push(encode('ta: world\n\n'))).toHaveLength(1);
	});

	it('drains both CRLF and LF terminators', () => {
		const parser = new SseParser();
		const events = parser.push(encode('data: a\r\n\r\ndata: b\r\n\r\n'));
		expect(events).toHaveLength(2);
		expect(events[0].data).toBe('a');
		expect(events[1].data).toBe('b');
	});

	it('treats lines starting with a colon as comments', () => {
		const parser = new SseParser();
		const events = parser.push(encode(': keepalive\ndata: real\n\n'));
		expect(events).toHaveLength(1);
		expect(events[0].data).toBe('real');
	});

	it('ignores malformed retry values', () => {
		const parser = new SseParser();
		const events = parser.push(encode('retry: abc\ndata: x\n\n'));
		expect(events[0].retry).toBeUndefined();
	});

	it('flush() emits a trailing event with no terminating blank line', () => {
		const parser = new SseParser();
		expect(parser.push(encode('data: tail'))).toEqual([]);
		const flushed = parser.flush();
		expect(flushed).toHaveLength(1);
		expect(flushed[0].data).toBe('tail');
	});

	it('isSseContentType matches text/event-stream with or without parameters', () => {
		expect(isSseContentType('text/event-stream')).toBe(true);
		expect(isSseContentType('text/event-stream; charset=utf-8')).toBe(true);
		expect(isSseContentType('TEXT/EVENT-STREAM')).toBe(true);
		expect(isSseContentType('application/json')).toBe(false);
		expect(isSseContentType(undefined)).toBe(false);
		expect(isSseContentType(null)).toBe(false);
	});
});
