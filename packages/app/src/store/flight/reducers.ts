import { ActionType, createReducer } from 'typesafe-actions';
import * as uuid from 'uuid';
import binaryStore from '../../lib/binary-store';

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
	.handleAction(actions.updateFlightProgress, (state, action) => {
		const { payload } = action;
		const { stage } = payload;

		switch (payload.stage) {
			case 'fetch_response':
				return {
					...state,
					currentFlight: {
						...state.currentFlight!,
						start: payload.payload.timestamp,
					},
				};

			case 'parsing_response':
				return {
					...state,
					currentFlight: {
						...state.currentFlight!,
						contentLength: payload.payload.contentLength,
					},
				};

			case 'reading_body':
				return state;

			default:
				break;
		}

		throw new Error(`unknown heartbeat stage: ${stage}`);
	})
	.handleAction(actions.completeFlight, (state, action) => {
		const { flightId, requestId, response } = action.payload;

		const newState: State = {
			...state,
			currentFlight: {
				...state.currentFlight!,
				flighting: false,
				response,
			},
		};

		if (!newState.flightHistory[requestId])
			newState.flightHistory[requestId] = [];

		const flight = {
			flightId,
			requestId,
			request: state.currentFlight!.request,
			response,
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
			request: action.payload.request,
			flighting: true,
			binaryStoreKey: action.payload.binaryStoreKey,
		},
		blackBox: {
			...state.blackBox,
			[action.payload.flightId]: true,
		},
	}));

export default flightReducer;
