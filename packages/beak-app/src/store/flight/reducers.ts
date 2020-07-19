import { ActionType, createReducer } from 'typesafe-actions';

import * as actions from './actions';
import { initialState, State } from './types';

type Actions = ActionType<typeof actions>;

const flightReducer = createReducer<State, Actions>(initialState);

export default flightReducer;
