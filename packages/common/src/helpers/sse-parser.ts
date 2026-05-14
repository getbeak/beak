import type { SseEvent } from '../types/requester';

/**
 * Incremental Server-Sent Events parser, per
 * https://html.spec.whatwg.org/multipage/server-sent-events.html#parsing-an-event-stream.
 *
 * Designed for the request pipeline: feed each incoming `Uint8Array` chunk
 * from the response body into {@link push} and consume the parsed events it
 * returns. `flush()` empties any trailing event when the stream closes.
 *
 * Implementation notes:
 *  - `\r\n`, `\n`, and `\r` are all valid line terminators.
 *  - An empty line dispatches the current event buffer.
 *  - Multiple `data:` lines on one event concatenate with `\n` between them.
 *  - The `retry:` field is only retained if its value parses as a non-negative
 *    integer (per spec).
 *  - Lines beginning with `:` are comments (ignored, but a useful "still alive"
 *    heartbeat from the server).
 *  - We use a streaming `TextDecoder` so multi-byte UTF-8 codepoints split
 *    across chunks round-trip correctly.
 */
export class SseParser {
	private readonly decoder = new TextDecoder('utf-8');
	private buffer = '';
	private currentData: string[] = [];
	private currentId: string | undefined;
	private currentEvent: string | undefined;
	private currentRetry: number | undefined;

	push(chunk: Uint8Array): SseEvent[] {
		this.buffer += this.decoder.decode(chunk, { stream: true });
		return this.drainBuffer();
	}

	flush(): SseEvent[] {
		this.buffer += this.decoder.decode();
		const events = this.drainBuffer();

		// A trailing partial line that never saw a terminator still counts as a
		// field — most servers send "data: x\n\n" but some omit the final blank
		// line on connection close.
		if (this.buffer.length > 0) {
			this.processLine(this.buffer);
			this.buffer = '';
		}

		if (this.currentData.length > 0 || this.currentEvent !== undefined || this.currentId !== undefined) {
			const trailing = this.materializeEvent();
			if (trailing) events.push(trailing);
		}
		return events;
	}

	private drainBuffer(): SseEvent[] {
		const events: SseEvent[] = [];
		let nextLineEnd = this.findLineEnd(this.buffer, 0);
		let cursor = 0;

		while (nextLineEnd.index !== -1) {
			const line = this.buffer.slice(cursor, nextLineEnd.index);
			cursor = nextLineEnd.index + nextLineEnd.skip;

			if (line === '') {
				const ev = this.materializeEvent();
				if (ev) events.push(ev);
			} else {
				this.processLine(line);
			}

			nextLineEnd = this.findLineEnd(this.buffer, cursor);
		}

		this.buffer = this.buffer.slice(cursor);
		return events;
	}

	private findLineEnd(text: string, from: number): { index: number; skip: number } {
		for (let i = from; i < text.length; i++) {
			const ch = text.charCodeAt(i);
			if (ch === 0x0a /* \n */) return { index: i, skip: 1 };
			if (ch === 0x0d /* \r */) {
				const isCrlf = i + 1 < text.length && text.charCodeAt(i + 1) === 0x0a;
				return { index: i, skip: isCrlf ? 2 : 1 };
			}
		}
		return { index: -1, skip: 0 };
	}

	private processLine(line: string) {
		if (line.startsWith(':')) return; // comment

		let field: string;
		let value: string;
		const colonIdx = line.indexOf(':');
		if (colonIdx === -1) {
			field = line;
			value = '';
		} else {
			field = line.slice(0, colonIdx);
			value = line.slice(colonIdx + 1);
			if (value.startsWith(' ')) value = value.slice(1);
		}

		switch (field) {
			case 'event':
				this.currentEvent = value;
				return;
			case 'data':
				this.currentData.push(value);
				return;
			case 'id':
				// Per spec, a NUL byte means ignore the field.
				if (!value.includes('\0')) this.currentId = value;
				return;
			case 'retry': {
				const n = Number.parseInt(value, 10);
				if (!Number.isNaN(n) && n >= 0 && String(n) === value) this.currentRetry = n;
				return;
			}
		}
	}

	private materializeEvent(): SseEvent | null {
		if (this.currentData.length === 0 && this.currentEvent === undefined && this.currentId === undefined) {
			// Reset retry too in case it was the only field — spec says drop the event
			// when there is no data, but the retry value persists.
			this.currentRetry = undefined;
			return null;
		}

		const ev: SseEvent = {
			receivedAt: Date.now(),
			data: this.currentData.join('\n'),
		};
		if (this.currentEvent !== undefined) ev.event = this.currentEvent;
		if (this.currentId !== undefined) ev.id = this.currentId;
		if (this.currentRetry !== undefined) ev.retry = this.currentRetry;

		this.currentData = [];
		this.currentEvent = undefined;
		// `id` persists across events per spec (it's the last-event-id) — but the
		// renderer-side event log uses it as a per-event identifier when shown to
		// the user. We treat it as transient here; reconnect logic that needs
		// last-event-id can read it off the last event in the log.
		this.currentId = undefined;
		this.currentRetry = undefined;

		return ev;
	}
}

/**
 * Convenience matcher — returns true when the supplied content-type header is
 * one Beak should parse as Server-Sent Events.
 */
export function isSseContentType(contentType: string | null | undefined): boolean {
	if (!contentType) return false;
	const semi = contentType.indexOf(';');
	const mime = (semi === -1 ? contentType : contentType.slice(0, semi)).trim().toLowerCase();
	return mime === 'text/event-stream';
}
