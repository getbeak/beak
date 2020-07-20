import { ActionType, createReducer } from 'typesafe-actions';

import * as actions from './actions';
import { initialState, State } from './types';

type Actions = ActionType<typeof actions>;

const flightReducer = createReducer<State, Actions>(initialState)
	.handleAction(actions.cancelFlightRequest, (state, action) => ({
		...state,
		blackBox: {
			...state.blackBox,
			[action.payload]: false,
		},
	}))
	.handleAction(actions.completeFlight, (state, action) => {
		const { flightId, requestId, responseStatus, info } = action.payload;

		const newState: State = {
			...state,
			currentFlight: {
				...state.currentFlight!,
				flighting: false,
				response: {
					status: responseStatus,
				},
			},
		};

		if (!newState.flightHistory[requestId])
			newState.flightHistory[requestId] = [];

		const flight = {
			flightId,
			requestId,
			info,
			response: {
				status: responseStatus,
			},
		};

		newState.flightHistory[requestId] = [
			flight,
			...newState.flightHistory[requestId],
		];

		return newState;
	})
	.handleAction(actions.beginFlightRequest, (state, action) => ({
		...state,
		currentFlight: {
			requestId: action.payload.requestId,
			flightId: action.payload.flightId,
			info: action.payload.info,
			flighting: true,
		},
		blackBox: {
			...state.blackBox,
			[action.payload.flightId]: true,
		},
	}));

export default flightReducer;
