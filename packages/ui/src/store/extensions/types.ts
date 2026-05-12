// Source of truth is @beak/core/extensions.
import {
	type Extension,
	type ExtensionsOpenedPayload,
	type ExtensionsState,
	type FailedExtension,
	initialExtensionsState,
} from '@beak/core/extensions';

export type State = ExtensionsState;
export const initialState: State = initialExtensionsState;

export type { Extension, ExtensionsOpenedPayload, FailedExtension };

export default { initialState };
