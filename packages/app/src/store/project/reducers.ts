/* eslint-disable no-param-reassign */

import {
	NamedEntries,
	NamedStringEntry,
	ValueEntries,
} from '@beak/common/types/beak-json-editor';
import { FolderNode, RequestBodyJson, RequestBodyUrlEncodedForm, RequestNode } from '@beak/common/types/beak-project';
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
			const node = state.tree[action.payload.requestId] as RequestNode;

			if (payload.verb !== void 0)
				node.info.verb = payload.verb;
			if (payload.url !== void 0)
				node.info.url = payload.url;
		})

		.addCase(actions.requestQueryAdded, (state, action) => {
			const { payload } = action;
			const node = state.tree[payload.requestId] as RequestNode;

			node.info.query[ksuid.generate('query').toString()] = {
				name: payload.name || '',
				value: payload.value || [''],
				enabled: true,
			};
		})
		.addCase(actions.requestQueryUpdated, (state, action) => {
			const { payload } = action;
			const node = state.tree[payload.requestId] as RequestNode;
			const existingItem = node.info.query[payload.identifier];

			if (payload.name !== void 0)
				existingItem.name = payload.name;
			if (payload.value !== void 0)
				existingItem.value = payload.value;
			if (payload.enabled !== void 0)
				existingItem.enabled = payload.enabled;
		})
		.addCase(actions.requestQueryRemoved, (state, action) => {
			const node = state.tree[action.payload.requestId] as RequestNode;

			delete node.info.query[action.payload.identifier];
		})

		.addCase(actions.requestHeaderAdded, (state, action) => {
			const { payload } = action;
			const node = state.tree[payload.requestId] as RequestNode;

			node.info.headers[ksuid.generate('header').toString()] = {
				name: payload.name || '',
				value: payload.value || [''],
				enabled: true,
			};
		})
		.addCase(actions.requestHeaderUpdated, (state, action) => {
			const { payload } = action;
			const node = state.tree[payload.requestId] as RequestNode;
			const existingItem = node.info.headers[payload.identifier];

			if (payload.name !== void 0)
				existingItem.name = payload.name;
			if (payload.value !== void 0)
				existingItem.value = payload.value;
			if (payload.enabled !== void 0)
				existingItem.enabled = payload.enabled;
		})
		.addCase(actions.requestHeaderRemoved, (state, action) => {
			const node = state.tree[action.payload.requestId] as RequestNode;

			delete node.info.headers[action.payload.identifier];
		})

		.addCase(actions.insertRequestNode, (state, action) => {
			const node = action.payload as RequestNode;

			state.tree[node.id] = node;
		})
		.addCase(actions.insertFolderNode, (state, action) => {
			const node = action.payload as FolderNode;

			state.tree[node.filePath] = node;
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
			const node = state.tree[action.payload.requestId] as RequestNode;

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
		})

		.addCase(actions.setLatestWrite, (state, { payload }) => {
			state.latestWrite = payload;
		})
		.addCase(actions.setWriteDebounce, (state, { payload }) => {
			const { requestId, nonce } = payload;

			state.writeDebouncer[requestId] = nonce;
		})

		.addCase(actions.requestBodyTypeChanged, (state, { payload }) => {
			const { requestId, type } = payload;
			const node = state.tree[requestId] as RequestNode;
			const body = node.info.body;

			body.type = type;
			body.payload = payload.payload;
		})
		.addCase(actions.requestBodyTextChanged, (state, action) => {
			const node = state.tree[action.payload.requestId] as RequestNode;

			node.info.body.payload = action.payload.text;
		})
		.addCase(actions.requestBodyJsonEditorNameChange, (state, { payload }) => {
			const { id, name, requestId } = payload;
			const node = state.tree[requestId] as RequestNode;
			const body = node.info.body as RequestBodyJson;

			(body.payload[id] as NamedEntries).name = name;
		})
		.addCase(actions.requestBodyJsonEditorValueChange, (state, { payload }) => {
			const { id, value, requestId } = payload;
			const node = state.tree[requestId] as RequestNode;
			const body = node.info.body as RequestBodyJson;

			(body.payload[id] as ValueEntries).value = value;
		})
		.addCase(actions.requestBodyJsonEditorTypeChange, (state, { payload }) => {
			const { id, type, requestId } = payload;
			const node = state.tree[requestId] as RequestNode;
			const body = node.info.body as RequestBodyJson;
			const entry = body.payload[id];

			entry.type = type;

			if (['array', 'object'].includes(type)) {
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				(entry as any).value = void 0;

				return;
			}

			if (type === 'boolean')
				(entry as ValueEntries).value = true;
			else if (type === 'null')
				(entry as ValueEntries).value = null;
		})
		.addCase(actions.requestBodyJsonEditorEnabledChange, (state, { payload }) => {
			const { id, enabled, requestId } = payload;
			const node = state.tree[requestId] as RequestNode;
			const body = node.info.body as RequestBodyJson;

			body.payload[id].enabled = enabled;
		})
		.addCase(actions.requestBodyJsonEditorAddEntry, (state, { payload }) => {
			const { id, requestId } = payload;
			const node = state.tree[requestId] as RequestNode;
			const body = node.info.body as RequestBodyJson;
			const entry = body.payload[id];
			const isRoot = entry.parentId === null;
			const allowsChildren = ['array', 'object'].includes(entry.type);
			const newId = ksuid.generate('jsonentry').toString();

			// Don't allow non-child friendly root entries to have children
			if (!allowsChildren && isRoot)
				return;

			body.payload[newId] = {
				id: newId,
				parentId: allowsChildren ? id : entry.parentId,
				type: 'string',
				name: entry.type === 'array' ? void 0 : '',
				enabled: true,
				value: [],
			} as NamedStringEntry;
		})
		.addCase(actions.requestBodyJsonEditorRemoveEntry, (state, { payload }) => {
			const { id, requestId } = payload;
			const node = state.tree[requestId] as RequestNode;
			const body = node.info.body as RequestBodyJson;

			delete body.payload[id];

			// TODO(afr): Cleanup unlinked entries
		})

		.addCase(actions.requestBodyUrlEncodedEditorNameChange, (state, { payload }) => {
			const { requestId, id, name } = payload;
			const node = state.tree[requestId] as RequestNode;
			const body = node.info.body as RequestBodyUrlEncodedForm;

			body.payload[id].name = name;
		})
		.addCase(actions.requestBodyUrlEncodedEditorValueChange, (state, { payload }) => {
			const { requestId, id, value } = payload;
			const node = state.tree[requestId] as RequestNode;
			const body = node.info.body as RequestBodyUrlEncodedForm;

			body.payload[id].value = value;
		})
		.addCase(actions.requestBodyUrlEncodedEditorEnabledChange, (state, { payload }) => {
			const { requestId, id, enabled } = payload;
			const node = state.tree[requestId] as RequestNode;
			const body = node.info.body as RequestBodyUrlEncodedForm;

			body.payload[id].enabled = enabled;
		})
		.addCase(actions.requestBodyUrlEncodedEditorAddItem, (state, { payload }) => {
			const { requestId } = payload;
			const node = state.tree[requestId] as RequestNode;
			const body = node.info.body as RequestBodyUrlEncodedForm;
			const id = ksuid.generate('urlencodeditem').toString();

			body.payload[id] = {
				name: '',
				value: [],
				enabled: true,
			};
		})
		.addCase(actions.requestBodyUrlEncodedEditorRemoveItem, (state, { payload }) => {
			const { requestId, id } = payload;
			const node = state.tree[requestId] as RequestNode;
			const body = node.info.body as RequestBodyUrlEncodedForm;

			delete body.payload[id];
		});
});

export default projectReducer;
