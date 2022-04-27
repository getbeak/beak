/* eslint-disable no-param-reassign */
import { createReducer } from '@reduxjs/toolkit';

import * as actions from './actions';
import { initialState } from './types';

const omniBarReducer = createReducer(initialState, builder => {
	builder
		.addCase(actions.showOmniBar, (state, { payload }) => {
			state.open = true;
			state.mode = payload.mode;
		})
		.addCase(actions.hideOmniBar, state => {
			state.open = false;
			state.mode = void 0;
		});
});

export default omniBarReducer;
