import { createAction } from '@reduxjs/toolkit';

import {
	ActionTypes as AT,
	ExtensionsOpenedPayload,
} from './types';

export const startExtensions = createAction(AT.START_EXTENSIONS);
export const extensionsOpened = createAction<ExtensionsOpenedPayload>(AT.EXTENSIONS_OPENED);

export default {
	startExtensions,
	extensionsOpened,
};
