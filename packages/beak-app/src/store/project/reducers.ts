import { ActionType, createReducer } from 'typesafe-actions';

import * as actions from './actions';
import { initialState, State } from './types';

type Actions = ActionType<typeof actions>;

const projectReducer = createReducer<State, Actions>(initialState)
	.handleAction(actions.openProject, state => ({
		...state,
		opening: true,
	}));

export default projectReducer;
