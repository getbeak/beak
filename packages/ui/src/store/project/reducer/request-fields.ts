import ksuid from '@beak/ksuid';
import type { ValidRequestNode } from '@getbeak/types/nodes';
import type { ActionReducerMapBuilder } from '@reduxjs/toolkit';

import * as actions from '../actions';
import type { State } from '../types';

export default function buildRequestFields(builder: ActionReducerMapBuilder<State>) {
	builder
		.addCase(actions.requestUriUpdated, (state, action) => {
			const { payload } = action;
			const node = state.tree[payload.requestId] as ValidRequestNode;
			if (payload.verb !== void 0) node.info.verb = payload.verb;
			if (payload.url !== void 0) node.info.url = payload.url;
		})

		.addCase(actions.requestQueryAdded, (state, action) => {
			const { payload } = action;
			const node = state.tree[payload.requestId] as ValidRequestNode;
			node.info.query[ksuid.generate('query').toString()] = {
				name: payload.name || '',
				value: payload.value || [''],
				enabled: true,
			};
		})
		.addCase(actions.requestQueryUpdated, (state, action) => {
			const { payload } = action;
			const node = state.tree[payload.requestId] as ValidRequestNode;
			const existingItem = node.info.query[payload.identifier];
			if (payload.name !== void 0) existingItem.name = payload.name;
			if (payload.value !== void 0) existingItem.value = payload.value;
			if (payload.enabled !== void 0) existingItem.enabled = payload.enabled;
		})
		.addCase(actions.requestQueryRemoved, (state, action) => {
			const node = state.tree[action.payload.requestId] as ValidRequestNode;
			delete node.info.query[action.payload.identifier];
		})

		.addCase(actions.requestHeaderAdded, (state, action) => {
			const { payload } = action;
			const node = state.tree[payload.requestId] as ValidRequestNode;
			node.info.headers[ksuid.generate('header').toString()] = {
				name: payload.name || '',
				value: payload.value || [''],
				enabled: true,
			};
		})
		.addCase(actions.requestHeaderUpdated, (state, action) => {
			const { payload } = action;
			const node = state.tree[payload.requestId] as ValidRequestNode;
			const existingItem = node.info.headers[payload.identifier];

			if (!existingItem) {
				console.warn('Header not found', payload, node.info.headers);
				return;
			}

			if (payload.name !== void 0) existingItem.name = payload.name;
			if (payload.value !== void 0) existingItem.value = payload.value;
			if (payload.enabled !== void 0) existingItem.enabled = payload.enabled;
		})
		.addCase(actions.requestHeaderRemoved, (state, action) => {
			const node = state.tree[action.payload.requestId] as ValidRequestNode;
			delete node.info.headers[action.payload.identifier];
		})

		.addCase(actions.requestOptionFollowRedirects, (state, { payload }) => {
			const node = state.tree[payload.requestId] as ValidRequestNode;
			node.info.options.followRedirects = payload.followRedirects;
		});
}
