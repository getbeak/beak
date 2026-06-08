import type { ValueProducerHandle } from './value-producers';

/**
 * Flattened multipart body — the resolved shape the requester receives
 * over IPC. Lives in `@beak/common` (rather than `@beak/state`) because
 * `@beak/requester-node` consumes it directly without depending on
 * Redux/state machinery.
 *
 * Each part's `name`, `filename`, and `contentType` are already strings
 * (resolved from `ValueSections` at prepare time). The binary part's
 * value is a {@link ValueProducerHandle} — inline for small bytes,
 * asset for disk-backed reads (no IPC for the bytes), stream for
 * IpcStreamService-backed pulls.
 */
export interface FlightBodyMultipart {
	type: 'multipart';
	payload: {
		boundary: string;
		parts: FlightMultipartPart[];
	};
}

export type FlightMultipartPart = FlightMultipartTextPart | FlightMultipartBinaryPart;

export interface FlightMultipartTextPart {
	kind: 'text';
	name: string;
	value: string;
	contentType?: string;
}

export interface FlightMultipartBinaryPart {
	kind: 'binary';
	name: string;
	filename?: string;
	contentType?: string;
	source: ValueProducerHandle;
}
