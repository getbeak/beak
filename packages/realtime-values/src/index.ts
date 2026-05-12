/**
 * Public SDK for authoring realtime-value extensions for Beak.
 *
 * Extension authors import the type contracts from here, plus optional
 * utility helpers. They describe a value handler that matches the
 * `RealtimeValue` / `EditableRealtimeValue` shape; **Beak itself decides
 * what gets registered** (based on which extension packages are installed
 * in the project). Extensions cannot mutate Beak's registry directly.
 */

export type { Context, ValuePart, ValueParts } from '@getbeak/types/values';
export type {
	EditableRealtimeValue,
	RealtimeValue,
	RealtimeValueBase,
	RealtimeValueInformation,
	UISection,
} from '@getbeak/types-realtime-value';
export { toWebSafeBase64 } from './utils/base64';
// Optional helpers that handler authors commonly need.
export { arrayBufferToHexString } from './utils/encoding';
