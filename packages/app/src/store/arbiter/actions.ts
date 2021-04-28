import { createAction } from '@reduxjs/toolkit';

import { ActionTypes } from './types';

export const startArbiter = createAction(ActionTypes.START_ARBITER);

export default {
	startArbiter,
};
