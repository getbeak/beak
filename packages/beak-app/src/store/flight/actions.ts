import { deprecated } from 'typesafe-actions';

import { ActionTypes } from './types';

const { createAction } = deprecated;

export const startFlight = createAction(
	ActionTypes.START_FLIGHT,
	action => () => action(),
);

export default {
	startFlight,
};
