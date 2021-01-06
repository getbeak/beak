import { createAsyncReducer } from '@beak/app/utils/redux/async-reducers';
import { combineReducers } from '@reduxjs/toolkit';

import { ActionTypes, initialState } from './types';

export default combineReducers({
	sendMagicLink: createAsyncReducer(ActionTypes.SEND_MAGIC_LINK, initialState.sendMagicLink),
});
