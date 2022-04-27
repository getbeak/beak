/* eslint-disable no-param-reassign */
import { createReducer } from '@reduxjs/toolkit';

import * as actions from './actions';
import { initialState } from './types';

const encryptionReducer = createReducer(initialState, builder => {
	builder
		.addCase(actions.showEncryptionView, state => {
			state.open = true;
		})
		.addCase(actions.hideEncryptionView, state => {
			state.open = false;
		});
});

export default encryptionReducer;
