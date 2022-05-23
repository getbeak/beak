export const ActionTypes = {
	START_EXTENSIONS: '@beak/global/extensions/START_EXTENSIONS',
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
}

export interface ValidExtension {
	id: string;
	name: string;
	version: string;
	filePath: string;

	valid: true;
}

export type Extension = FailedExtension | ValidExtension;

export interface ExtensionsOpenedPayload {
	extensions: Extension[];
}

export default {
	ActionTypes,
	initialState,
};
