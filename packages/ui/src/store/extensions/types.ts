// Source of truth is @beak/state/extensions.
import {
	type Extension,
	type ExtensionsState,
	type FailedExtension,
	type LoadedExtension,
	initialExtensionsState,
} from '@beak/state/extensions';

export type State = ExtensionsState;
export const initialState: State = initialExtensionsState;

export type { Extension, FailedExtension, LoadedExtension };

export default { initialState };
