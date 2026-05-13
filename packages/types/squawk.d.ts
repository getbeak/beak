// Public, IPC-safe shape of a Squawk / BeakError. Mirrors the runtime class
// in `@beak/squawk` but lives here as a `.d.ts` so consumers outside the
// monorepo can type the wire format without importing the implementation.
export interface Squawk extends Error {
	code: string;
	kind: string;
	httpStatus: number | undefined;
	readonly isHandled: true;
	// biome-ignore lint/suspicious/noExplicitAny: meta is intentionally untyped.
	meta: Record<string, any>;
	reasons: Squawk[];
	serialize(): SerializedSquawk;
	toJSON(): SerializedSquawk;
}

export interface SerializedReason {
	kind: string;
	// biome-ignore lint/suspicious/noExplicitAny: meta is intentionally untyped.
	meta?: Record<string, any>;
	reasons?: SerializedReason[];
}

export interface SerializedSquawk {
	kind: string;
	message: string;
	// biome-ignore lint/suspicious/noExplicitAny: meta is intentionally untyped.
	meta: Record<string, any>;
	httpStatus?: number;
	reasons: SerializedReason[];
}
