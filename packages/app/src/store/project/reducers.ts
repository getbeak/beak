/* eslint-disable no-param-reassign */

import { TypedObject } from '@beak/common/helpers/typescript';
import ksuid from '@beak/ksuid';
import type { EntryMap, NamedEntries, NamedStringEntry, ValueEntries } from '@getbeak/types/body-editor-json';
import type { FolderNode, ValidRequestNode } from '@getbeak/types/nodes';
import type { RequestBodyJson, RequestBodyUrlEncodedForm } from '@getbeak/types/request';
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
			state.id = payload.id;
		})
		.addCase(actions.projectOpened, (state, { payload }) => {
			state.tree = payload.tree;
			state.loaded = true;
		})

		.addCase(actions.requestUriUpdated, (state, action) => {
			const { payload } = action;
			const node = state.tree[action.payload.requestId] as ValidRequestNode;

			if (payload.verb !== void 0)
				node.info.verb = payload.verb;
			if (payload.url !== void 0)
				node.info.url = payload.url;
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

			if (payload.name !== void 0)
				existingItem.name = payload.name;
			if (payload.value !== void 0)
				existingItem.value = payload.value;
			if (payload.enabled !== void 0)
				existingItem.enabled = payload.enabled;
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

			if (payload.name !== void 0)
				existingItem.name = payload.name;
			if (payload.value !== void 0)
				existingItem.value = payload.value;
			if (payload.enabled !== void 0)
				existingItem.enabled = payload.enabled;
		})
		.addCase(actions.requestHeaderRemoved, (state, action) => {
			const node = state.tree[action.payload.requestId] as ValidRequestNode;

			delete node.info.headers[action.payload.identifier];
		})

		.addCase(actions.insertRequestNode, (state, action) => {
			const node = action.payload as ValidRequestNode;

			state.tree[node.id] = node;
		})
		.addCase(actions.insertFolderNode, (state, action) => {
			const node = action.payload as FolderNode;

			state.tree[node.filePath] = node;
		})

		.addCase(actions.removeNodeFromStore, (state, { payload }) => {
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			const { [payload]: remove, ...rest } = state.tree;

			state.tree = rest;
		})
		.addCase(actions.removeNodeFromStoreByPath, (state, { payload }) => {
			const node = Object.values(state.tree).find(n => n.filePath === payload);

			if (!node)
				return;

			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			const { [node?.id]: remove, ...rest } = state.tree;

			state.tree = rest;
		})

		.addCase(actions.renameStarted, (state, action) => {
			const { requestId } = action.payload;

			const node = state.tree[requestId];

			state.activeRename = {
				id: requestId,
				name: node.name,
			};
		})
		.addCase(actions.renameUpdated, (state, action) => {
			const { requestId, name } = action.payload;

			if (state.activeRename?.id !== requestId)
				return;

			state.activeRename.name = name;
		})
		.addCase(actions.renameCancelled, (state, action) => {
			if (state.activeRename?.id === action.payload.requestId)
				state.activeRename = void 0;
		})
		.addCase(actions.renameResolved, (state, action) => {
			if (state.activeRename?.id === action.payload.requestId)
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
			const node = state.tree[requestId] as ValidRequestNode;
			const body = node.info.body;

			body.type = type;
			body.payload = payload.payload;
		})
		.addCase(actions.requestBodyTextChanged, (state, action) => {
			const node = state.tree[action.payload.requestId] as ValidRequestNode;

			node.info.body.payload = action.payload.text;
		})
		.addCase(actions.requestBodyFileChanged, (state, action) => {
			const node = state.tree[action.payload.requestId] as ValidRequestNode;

			node.info.body.payload = {
				fileReferenceId: action.payload.fileReferenceId,
				contentType: action.payload.contentType,
			};
		})
		.addCase(actions.requestBodyJsonEditorNameChange, (state, { payload }) => {
			const { id, name, requestId } = payload;
			const node = state.tree[requestId] as ValidRequestNode;
			const body = node.info.body as RequestBodyJson;

			if (!body.payload[id])
				return;

			(body.payload[id] as NamedEntries).name = name;
		})
		.addCase(actions.requestBodyJsonEditorValueChange, (state, { payload }) => {
			const { id, value, requestId } = payload;
			const node = state.tree[requestId] as ValidRequestNode;
			const body = node.info.body as RequestBodyJson;

			if (!body.payload[id])
				return;

			(body.payload[id] as ValueEntries).value = value;
		})
		.addCase(actions.requestBodyJsonEditorTypeChange, (state, { payload }) => {
			const { id, type, requestId } = payload;
			const node = state.tree[requestId] as ValidRequestNode;
			const body = node.info.body as RequestBodyJson;
			const entry = body.payload[id];

			if (!entry)
				return;

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
			else
				(entry as ValueEntries).value = [];

			// Cleanup orphaned entries
			body.payload = removeOrphanedJsonEntries(body.payload);
		})
		.addCase(actions.requestBodyJsonEditorEnabledChange, (state, { payload }) => {
			const { id, enabled, requestId } = payload;
			const node = state.tree[requestId] as ValidRequestNode;
			const body = node.info.body as RequestBodyJson;

			if (!body.payload[id])
				return;

			body.payload[id].enabled = enabled;
		})
		.addCase(actions.requestBodyJsonEditorAddEntry, (state, { payload }) => {
			const { id, requestId } = payload;
			const node = state.tree[requestId] as ValidRequestNode;
			const body = node.info.body as RequestBodyJson;
			const entry = body.payload[id];
			const isRoot = entry.parentId === null;
			const allowsChildren = ['array', 'object'].includes(entry.type);
			const newId = ksuid.generate('jsonentry').toString();

			if (!entry)
				return;

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
			const node = state.tree[requestId] as ValidRequestNode;
			const body = node.info.body as RequestBodyJson;

			delete body.payload[id];

			// Cleanup orphaned entries
			body.payload = removeOrphanedJsonEntries(body.payload);
		})

		.addCase(actions.requestBodyUrlEncodedEditorNameChange, (state, { payload }) => {
			const { requestId, id, name } = payload;
			const node = state.tree[requestId] as ValidRequestNode;
			const body = node.info.body as RequestBodyUrlEncodedForm;

			body.payload[id].name = name;
		})
		.addCase(actions.requestBodyUrlEncodedEditorValueChange, (state, { payload }) => {
			const { requestId, id, value } = payload;
			const node = state.tree[requestId] as ValidRequestNode;
			const body = node.info.body as RequestBodyUrlEncodedForm;

			body.payload[id].value = value;
		})
		.addCase(actions.requestBodyUrlEncodedEditorEnabledChange, (state, { payload }) => {
			const { requestId, id, enabled } = payload;
			const node = state.tree[requestId] as ValidRequestNode;
			const body = node.info.body as RequestBodyUrlEncodedForm;

			body.payload[id].enabled = enabled;
		})
		.addCase(actions.requestBodyUrlEncodedEditorAddItem, (state, { payload }) => {
			const { requestId } = payload;
			const node = state.tree[requestId] as ValidRequestNode;
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
			const node = state.tree[requestId] as ValidRequestNode;
			const body = node.info.body as RequestBodyUrlEncodedForm;

			delete body.payload[id];
		})

		.addCase(actions.requestOptionFollowRedirects, (state, { payload }) => {
			const { requestId, followRedirects } = payload;
			const node = state.tree[requestId] as ValidRequestNode;

			node.info.options.followRedirects = followRedirects;
		})

		.addCase(actions.alertInsert, (state, { payload }) => {
			const { ident, alert } = payload;

			state.alerts[ident] = alert;
		})
		.addCase(actions.alertRemove, (state, { payload }) => {
			state.alerts[payload] = void 0;
		})
		.addCase(actions.alertRemoveDependents, (state, { payload }) => {
			const { requestId } = payload;

			const removeIdents = TypedObject.keys(state.alerts)
				.map(i => {
					const alert = state.alerts[i];

					if (!alert)
						return null;

					const dependencies = alert.dependencies;

					if (!dependencies)
						return null;

					if (dependencies.requestId !== void 0 && dependencies.requestId === requestId)
						return i;

					return null;
				})
				.filter(Boolean) as unknown as string[];

			removeIdents.forEach(i => void (state.alerts[i] = void 0));
		})
		.addCase(actions.alertRemoveType, (state, { payload }) => {
			const removeIdents = TypedObject.keys(state.alerts)
				.map(i => {
					const alert = state.alerts[i]!;

					if (alert.type === payload)
						return i;

					return null;
				})
				.filter(Boolean) as unknown as string[];

			removeIdents.forEach(i => void (state.alerts[i] = void 0));
		})
		.addCase(actions.alertClear, state => {
			state.alerts = { };
		});
});

function removeOrphanedJsonEntries(body: EntryMap) {
	const allRelevantIds = TypedObject.keys(body).reduce<string[]>((acc, k) => {
		const entry = body[k];

		if (entry && ['array', 'object'].includes(entry.type))
			return [...acc, k];

		return acc;
	}, []);

	// Only return entries where the parent id exists, and the parent is an object/array (or root!)
	return TypedObject.keys(body).reduce<EntryMap>((acc, k) => {
		const entry = body[k];

		if (entry.parentId === null || allRelevantIds.includes(entry.parentId))
			return { ...acc, [k]: entry };

		return acc;
	}, {});
}

export default projectReducer;
