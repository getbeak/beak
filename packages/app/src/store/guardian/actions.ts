import { createAction } from '@reduxjs/toolkit';

import { ActionTypes } from './types';

export const startGuardian = createAction(ActionTypes.START_GUARDIAN);

export default {
	startGuardian,
};
