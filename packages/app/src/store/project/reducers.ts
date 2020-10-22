/* eslint-disable no-param-reassign */

import { RequestNode } from '@beak/common/types/beak-project';
// @ts-ignore
import ksuid from '@cuvva/ksuid';
import { createReducer } from '@reduxjs/toolkit';

import * as actions from './actions';
import { initialState } from './types';

const projectReducer = createReducer(initialState, builder => {
	builder
		.addCase(actions.openProject, state => {
			state.opening = true;
		})
		.addCase(actions.projectOpened, (state, action) => {
			const { tree, name, projectPath } = action.payload;

			state.opening = false;
			state.tree = tree;
			state.name = name;
			state.projectPath = projectPath;
		})
		.addCase(actions.requestSelected, (state, action) => {
			state.selectedRequest = action.payload;
		})

		.addCase(actions.requestQueryAdded, (state, action) => {
			const { payload } = action;
			const node = state.tree![payload.requestId] as RequestNode;

			node.info.uri.query[ksuid.generate('query').toString()] = {
				name: payload.name || '',
				value: payload.value || '',
				enabled: true,
			};
		})
		.addCase(actions.requestQueryUpdated, (state, action) => {
			const { payload } = action;
			const node = state.tree![payload.requestId] as RequestNode;
			const existingItem = node.info.uri.query[payload.identifier];

			if (payload.name !== void 0)
				existingItem.name = payload.name;
			if (payload.value !== void 0)
				existingItem.value = payload.value;
			if (payload.enabled !== void 0)
				existingItem.enabled = payload.enabled;
		})
		.addCase(actions.requestQueryRemoved, (state, action) => {
			const node = state.tree![action.payload.requestId] as RequestNode;

			delete node.info.uri.query[action.payload.identifier];
		})

		.addCase(actions.requestHeaderAdded, (state, action) => {
			const { payload } = action;
			const node = state.tree![payload.requestId] as RequestNode;

			node.info.headers[ksuid.generate('header').toString()] = {
				name: payload.name || '',
				value: payload.value || '',
				enabled: true,
			};
		})
		.addCase(actions.requestHeaderUpdated, (state, action) => {
			const { payload } = action;
			const node = state.tree![payload.requestId] as RequestNode;
			const existingItem = node.info.headers[payload.identifier];

			if (payload.name !== void 0)
				existingItem.name = payload.name;
			if (payload.value !== void 0)
				existingItem.value = payload.value;
			if (payload.enabled !== void 0)
				existingItem.enabled = payload.enabled;
		})
		.addCase(actions.requestHeaderRemoved, (state, action) => {
			const node = state.tree![action.payload.requestId] as RequestNode;

			delete node.info.headers[action.payload.identifier];
		})

		.addCase(actions.requestBodyTextChanged, (state, action) => {
			const node = state.tree![action.payload.requestId] as RequestNode;

			node.info.body.type = 'text';
			node.info.body.payload = action.payload.text;
		})
		.addCase(actions.requestBodyJsonChanged, (state, action) => {
			const node = state.tree![action.payload.requestId] as RequestNode;

			node.info.body.type = 'json';
			node.info.body.payload = action.payload.json;
		})

		.addCase(actions.requestUriUpdated, (state, action) => {
			const { payload } = action;
			const node = state.tree![action.payload.requestId] as RequestNode;

			if (payload.verb !== void 0)
				node.info.verb = payload.verb;
			if (payload.protocol !== void 0)
				node.info.uri.protocol = payload.protocol;
			if (payload.hostname !== void 0)
				node.info.uri.hostname = payload.hostname;
			if (payload.path !== void 0)
				node.info.uri.path = payload.path;
			if (payload.fragment !== void 0)
				node.info.uri.fragment = payload.fragment;
		})
		.addCase(actions.refreshNodeState, (state, action) => {
			const node = action.payload as RequestNode;

			state.tree![node.id] = node;
		});
});

export default projectReducer;
