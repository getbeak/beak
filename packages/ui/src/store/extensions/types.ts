// Source of truth is @beak/state/extensions.
import {
	type Extension,
	type ExtensionsOpenedPayload,
	type ExtensionsState,
	type FailedExtension,
	initialExtensionsState,
} from '@beak/state/extensions';

export type State = ExtensionsState;
export const initialState: State = initialExtensionsState;

export type { Extension, ExtensionsOpenedPayload, FailedExtension };

export default { initialState };
