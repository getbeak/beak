// Source of truth is @beak/state/extensions.
import {
	type Extension,
	type ExtensionsSliceState,
	type FailedExtension,
	initialExtensionsSliceState,
	type LoadedExtension,
} from '@beak/state/extensions';

export type State = ExtensionsSliceState;
export const initialState: State = initialExtensionsSliceState;

export type { Extension, FailedExtension, LoadedExtension };

export default { initialState };
