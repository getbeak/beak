import { ArbiterStatus } from '@beak/shared-common/types/arbiter';
import { createAction } from '@reduxjs/toolkit';

import { ActionTypes } from './types';

export const startArbiter = createAction(ActionTypes.START_ARBITER);
export const updateStatus = createAction<ArbiterStatus>(ActionTypes.UPDATE_STATUS);

export default {
	startArbiter,
	updateStatus,
};
