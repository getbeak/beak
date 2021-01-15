/* eslint-disable no-param-reassign */

import { FolderNode, RequestNode } from '@beak/common/types/beak-project';
// @ts-ignore
import ksuid from '@cuvva/ksuid';
import { createReducer } from '@reduxjs/toolkit';

import * as actions from './actions';
import { initialState } from './types';

const projectReducer = createReducer(initialState, builder => {
	builder
		.addCase(actions.startProject, state => {
			state.loaded = false;
		})
		.addCase(actions.insertProjectInfo, (state, { payload }) => {
			state.name = payload.name;
			state.projectPath = payload.projectPath;
			state.projectTreePath = payload.treePath;
		})
		.addCase(actions.projectOpened, (state, { payload }) => {
			state.tree = payload.tree;
			state.loaded = true;
		})

		.addCase(actions.tabSelected, (state, action) => {
			const tab = action.payload;

			if (tab !== void 0) {
				if (!state.tabs.find(t => t.payload === tab.payload)) {
					// Remove any temporary tabs if we are inserting a new one
					state.tabs = state.tabs.filter(t => !t.temporary);

					state.tabs.push(tab);
				}
			}

			state.selectedTabPayload = tab?.payload ?? void 0;
		})
		.addCase(actions.closeSelectedTab, (state, { payload }) => {
			state.tabs = state.tabs.filter(r => r.payload !== payload);
		})
		.addCase(actions.closeOtherSelectedTabs, (state, { payload }) => {
			const tab = state.tabs.find(t => t.payload === payload);

			state.tabs = [];

			if (tab)
				state.tabs.push(tab);

			state.selectedTabPayload = payload;
		})
		.addCase(actions.closeSelectedTabsToRight, (state, { payload }) => {
			const index = state.tabs.findIndex(t => t.payload === payload);

			state.tabs = state.tabs.slice(0, index + 1);
		})
		.addCase(actions.closeSelectedTabsToLeft, (state, { payload }) => {
			const index = state.tabs.findIndex(t => t.payload === payload);

			state.tabs = state.tabs.slice(index);
			state.selectedTabPayload = state.tabs[0].payload;
		})
		.addCase(actions.closeAllSelectedTabs, state => {
			state.tabs = [];
			state.selectedTabPayload = void 0;
		})
		.addCase(actions.setTabAsPermanent, (state, { payload }) => {
			const index = state.tabs.findIndex(t => t.payload === payload);

			state.tabs[index].temporary = false;
		})

		.addCase(actions.requestUriUpdated, (state, action) => {
			const { payload } = action;
			const node = state.tree![action.payload.requestId] as RequestNode;

			if (payload.verb !== void 0)
				node.info.verb = payload.verb;
			if (payload.url !== void 0)
				node.info.url = payload.url;
		})

		.addCase(actions.requestQueryAdded, (state, action) => {
			const { payload } = action;
			const node = state.tree![payload.requestId] as RequestNode;

			node.info.query[ksuid.generate('query').toString()] = {
				name: payload.name || '',
				value: payload.value || [''],
				enabled: true,
			};
		})
		.addCase(actions.requestQueryUpdated, (state, action) => {
			const { payload } = action;
			const node = state.tree![payload.requestId] as RequestNode;
			const existingItem = node.info.query[payload.identifier];

			if (payload.name !== void 0)
				existingItem.name = payload.name;
			if (payload.value !== void 0)
				existingItem.value = payload.value;
			if (payload.enabled !== void 0)
				existingItem.enabled = payload.enabled;
		})
		.addCase(actions.requestQueryRemoved, (state, action) => {
			const node = state.tree![action.payload.requestId] as RequestNode;

			delete node.info.query[action.payload.identifier];
		})

		.addCase(actions.requestHeaderAdded, (state, action) => {
			const { payload } = action;
			const node = state.tree![payload.requestId] as RequestNode;

			node.info.headers[ksuid.generate('header').toString()] = {
				name: payload.name || '',
				value: payload.value || [''],
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

		.addCase(actions.insertRequestNode, (state, action) => {
			const node = action.payload as RequestNode;

			state.tree![node.id] = node;
		})
		.addCase(actions.insertFolderNode, (state, action) => {
			const node = action.payload as FolderNode;

			state.tree![node.filePath] = node;
		})

		.addCase(actions.removeNodeFromStore, (state, { payload }) => {
			const { [payload]: remove, ...rest } = state.tree;

			state.tree = rest;
		})
		.addCase(actions.removeNodeFromStoreByPath, (state, { payload }) => {
			const node = Object.values(state.tree).find(n => n.filePath === payload);

			if (!node)
				return;

			const { [node?.id]: remove, ...rest } = state.tree;

			state.tree = rest;
		})

		.addCase(actions.requestRenameStarted, (state, action) => {
			const node = state.tree![action.payload.requestId] as RequestNode;

			state.activeRename = {
				requestId: action.payload.requestId,
				name: node.name,
			};
		})
		.addCase(actions.requestRenameUpdated, (state, action) => {
			const { requestId, name } = action.payload;

			if (state.activeRename?.requestId !== requestId)
				return;

			state.activeRename.name = name;
		})
		.addCase(actions.requestRenameCancelled, (state, action) => {
			if (state.activeRename?.requestId === action.payload.requestId)
				state.activeRename = void 0;
		})
		.addCase(actions.requestRenameResolved, (state, action) => {
			if (state.activeRename?.requestId === action.payload.requestId)
				state.activeRename = void 0;
		});
});

export default projectReducer;
