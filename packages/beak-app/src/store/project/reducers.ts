import { ActionType, createReducer } from 'typesafe-actions';

import * as actions from './actions';
import { initialState, State } from './types';

type Actions = ActionType<typeof actions>;

const projectReducer = createReducer<State, Actions>(initialState)
	.handleAction(actions.projectOpened, (state, action) => ({
		...state,
		opening: false,
		tree: action.payload.tree,
		name: action.payload.name,
		projectPath: action.payload.projectPath,
	}))
	.handleAction(actions.openProject, state => ({
		...state,
		opening: true,
	}));

export default projectReducer;
