/* eslint-disable no-param-reassign */
import { createReducer } from '@reduxjs/toolkit';

import * as actions from './actions';
import { initialState } from './types';

const gitReducer = createReducer(initialState, builder => {
	builder
		.addCase(actions.extensionsOpened, (state, { payload }) => {
			state.extensions = payload.extensions;
		});
});

export default gitReducer;
