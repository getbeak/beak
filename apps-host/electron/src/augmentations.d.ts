import type { Context } from '@getbeak/types/values';

declare module '@getbeak/types-realtime-value' {
	interface GenericDictionary {
		[k: string]: any;
	}

	interface RealtimeValueBase {
		type: string;
		external: boolean;
	}

	interface RealtimeValue<TPayload extends GenericDictionary> {

		/**
		 * Gets the string value of the value, given the payload body
		 * @param {Context} ctx The project context.
		 * @param {TPayload} payload This instance of the value's payload data.
		 * @param {number} recursiveDepth The internal recursive depth level.
		 */
		getValue: (ctx: Context, payload: TPayload, recursiveDepth: number) => Promise<string>;
	}

	interface EditableRealtimeValue<TPayload extends GenericDictionary> {

		/**
		 * Gets the string value of the value, given the payload body
		 * @param {Context} ctx The project context.
		 * @param {TPayload} payload This instance of the value's payload data.
		 * @param {number} recursiveDepth The internal recursive depth level.
		 */
		getValue: (ctx: Context, payload: TPayload, recursiveDepth: number) => Promise<string>;
	}
}
