import { createReducer } from '@reduxjs/toolkit';

import * as actions from './actions';
import { initialState } from './types';

const arbiterReducer = createReducer(initialState, builder => {
	builder
		.addCase(actions.updateStatus, (state, { payload }) => {
			state.status = payload;
		});
});

export default arbiterReducer;
