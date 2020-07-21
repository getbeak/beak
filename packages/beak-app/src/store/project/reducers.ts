import { ActionType, createReducer } from 'typesafe-actions';
import cloneDeep from 'lodash.clonedeep';

import * as actions from './actions';
import { initialState, State } from './types';
import { RequestNode } from '../../lib/project/types';

type Actions = ActionType<typeof actions>;

const projectReducer = createReducer<State, Actions>(initialState)
	.handleAction(actions.projectOpened, (state, action) => ({
		...state,
		opening: false,
		tree: action.payload.tree,
		name: action.payload.name,
		projectPath: action.payload.projectPath,
	}))
	.handleAction(actions.requestSelected, (state, action) => ({
		...state,
		selectedRequest: action.payload,
	}))
	.handleAction(actions.openProject, state => ({
		...state,
		opening: true,
	}))
	.handleAction(actions.requestUriUpdated, (state, action) => {
		const { payload } = action;
		const newRequest = cloneDeep(state.tree![payload.requestId]) as RequestNode;

		if (payload.verb !== void 0)
			newRequest.info.uri.verb = payload.verb;
		if (payload.protocol !== void 0)
			newRequest.info.uri.protocol = payload.protocol;
		if (payload.hostname !== void 0)
			newRequest.info.uri.hostname = payload.hostname;
		if (payload.path !== void 0)
			newRequest.info.uri.path = payload.path;
		// TODO(afr): Handle query
		if (payload.fragment !== void 0)
			newRequest.info.uri.fragment = payload.fragment;

		return {
			...state,
			tree: {
				...state.tree,
				[payload.requestId]: newRequest,
			},
		};
	});

export default projectReducer;
