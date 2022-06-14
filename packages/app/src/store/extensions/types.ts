import { RealtimeValueExtension } from '@beak/common/types/extensions';
import Squawk from '@beak/common/utils/squawk';

export const ActionTypes = {
	START_EXTENSIONS: '@beak/global/extensions/START_EXTENSIONS',
	RELOAD_EXTENSIONS: '@beak/global/extensions/RELOAD_EXTENSIONS',
	EXTENSIONS_OPENED: '@beak/global/extensions/EXTENSIONS_OPENED',
};

export interface State {
	extensions: Extension[];
}

export const initialState: State = {
	extensions: [],
};

export interface FailedExtension {
	filePath: string;
	valid: false;
	error: Squawk;
}

export type Extension = FailedExtension | RealtimeValueExtension;

export interface ExtensionsOpenedPayload {
	extensions: Extension[];
}

export default {
	ActionTypes,
	initialState,
};
