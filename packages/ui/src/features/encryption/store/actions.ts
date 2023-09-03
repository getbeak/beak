import { createAction } from '@reduxjs/toolkit';

import { ActionTypes } from './types';

export const showEncryptionView = createAction(ActionTypes.SHOW_ENCRYPTION_VIEW);
export const hideEncryptionView = createAction(ActionTypes.HIDE_ENCRYPTION_VIEW);

export default {
	showEncryptionView,
	hideEncryptionView,
};
