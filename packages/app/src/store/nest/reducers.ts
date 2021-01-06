import { createAsyncReducer } from '@beak/app/utils/redux/async-reducers';
import { combineReducers } from '@reduxjs/toolkit';

import { ActionTypes, initialState } from './types';

export default combineReducers({
	handleMagicLink: createAsyncReducer(ActionTypes.HANDLE_MAGIC_LINK, initialState.handleMagicLink),
	sendMagicLink: createAsyncReducer(ActionTypes.SEND_MAGIC_LINK, initialState.sendMagicLink),
});
