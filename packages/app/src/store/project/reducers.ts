/* eslint-disable no-param-reassign */

import { Entries, EntryType, NamedEntries, NamedStringEntry, StringEntry } from '@beak/common/types/beak-json-editor';
import { FolderNode, RequestBodyJson, RequestNode } from '@beak/common/types/beak-project';
// @ts-ignore
import ksuid from '@cuvva/ksuid';
import { createReducer } from '@reduxjs/toolkit';
import get from 'lodash.get';
import set from 'lodash.set';

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

		.addCase(actions.requestBodyTextChanged, (state, action) => {
			const node = state.tree[action.payload.requestId] as RequestNode;

			node.info.body.type = 'text';
			node.info.body.payload = action.payload.text;
		})
		.addCase(actions.requestBodyJsonEditorNameChange, (state, { payload }) => {
			const { jPath, name, requestId } = payload;
			const node = state.tree[requestId] as RequestNode;
			const body = node.info.body as RequestBodyJson;
			const atRoot = jPath === '';

			// Sanity check, not possible for root node to have a name
			if (atRoot)
				return;

			set(body.payload, jPath, name);
		})
		.addCase(actions.requestBodyJsonEditorValueChange, (state, { payload }) => {
			const { jPath, value, requestId } = payload;
			const node = state.tree[requestId] as RequestNode;
			const body = node.info.body as RequestBodyJson;

			set(body.payload, jPath, value);
		})
		.addCase(actions.requestBodyJsonEditorTypeChange, (state, { payload }) => {
			const { jPath, type, requestId } = payload;
			const node = state.tree[requestId] as RequestNode;
			const body = node.info.body as RequestBodyJson;
			const existingEntry = get(body.payload, jPath);

			set(body.payload, jPath, convertEntryToType(type, existingEntry));
		})
		.addCase(actions.requestBodyJsonEditorEnabledChange, (state, { payload }) => {
			const { jPath, enabled, requestId } = payload;
			const node = state.tree[requestId] as RequestNode;
			const body = node.info.body as RequestBodyJson;

			set(body.payload, jPath, enabled);
		})
		.addCase(actions.requestBodyJsonEditorAddEntry, (state, { payload }) => {
			const { jPath, requestId } = payload;
			const node = state.tree[requestId] as RequestNode;
			const body = node.info.body as RequestBodyJson;
			const isRoot = jPath === '';
			const item = (isRoot ? body.payload : get(body.payload, jPath)) as Entries;
			const insertAsSibling = item.type !== 'array' && item.type !== 'object';
			const insertBaseJPath = insertAsSibling ? getSiblingPath(jPath) : [jPath, '[value]']
				.filter(Boolean)
				.join('.');

			const children = get(body.payload, insertBaseJPath);
			const insertPath = [insertBaseJPath, `[${children.length}]`].join('.');
			let type = item.type;

			// If we are inserting the item as a sibling, we need to get the parent's type
			if (insertAsSibling) {
				const index = insertBaseJPath.lastIndexOf('[value]');
				const parent = insertBaseJPath.substring(0, index - 1);
				const itemTwo = parent === '' ? body.payload : get(body.payload, parent) as Entries;

				type = itemTwo.type;
			}

			if (type === 'object') {
				set(body.payload, insertPath, {
					type: 'string',
					enabled: true,
					name: '',
					value: [''],
				} as NamedStringEntry);
			} else if (type === 'array') {
				set(body.payload, insertPath, {
					type: 'string',
					enabled: true,
					value: [''],
				} as StringEntry);
			}
		})
		.addCase(actions.requestBodyJsonEditorRemoveEntry, (state, { payload }) => {
			const { jPath, requestId } = payload;
			const node = state.tree[requestId] as RequestNode;
			const body = node.info.body as RequestBodyJson;
			const index = jPath.lastIndexOf('.');
			const path = jPath.substring(0, index);
			const removeIndex = Number(jPath.substr(index + 1).replace(/[[\]]/g, ''));
			const children = get(body.payload, path) as Entries[];

			children.splice(removeIndex, 1);

			set(body.payload, path, children);
		});
});

export default projectReducer;

function getSiblingPath(jPath: string) {
	const index = jPath.lastIndexOf('.');
	const path = jPath.substring(0, index);

	return path;
}

function convertEntryToType(newType: EntryType, existingEntry: Entries | NamedEntries) {
	const name = (existingEntry as NamedEntries).name;
	const output: any = { type: newType, enabled: true };

	if (['string', 'number'].includes(newType))
		output.value = [''];
	else if (newType === 'boolean')
		output.value = true;
	else if (newType === 'null')
		output.value = null;
	else if (['object', 'array'].includes(newType))
		output.value = [];

	if (name !== void 0) {
		output.name = name;

		return output as NamedEntries;
	}

	return output as Entries;
}
