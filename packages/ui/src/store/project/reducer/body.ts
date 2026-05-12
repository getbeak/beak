import { TypedObject } from '@beak/common/helpers/typescript';
import ksuid from '@beak/ksuid';
import type { EntryMap, NamedEntries, NamedStringEntry, ValueEntries } from '@getbeak/types/body-editor-json';
import type { ValidRequestNode } from '@getbeak/types/nodes';
import type { RequestBodyGraphQl, RequestBodyJson, RequestBodyUrlEncodedForm } from '@getbeak/types/request';
import type { ActionReducerMapBuilder } from '@reduxjs/toolkit';

import * as actions from '../actions';
import type { State } from '../types';

export default function buildBody(builder: ActionReducerMapBuilder<State>) {
	builder
		.addCase(actions.requestBodyTypeChanged, (state, { payload }) => {
			const node = state.tree[payload.requestId] as ValidRequestNode;
			node.info.body.type = payload.type;
			node.info.body.payload = payload.payload;
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
		});

	buildJsonEditor(builder);
	buildUrlEncodedEditor(builder);
	buildGraphQlEditor(builder);
}

function buildJsonEditor(builder: ActionReducerMapBuilder<State>) {
	builder
		.addCase(actions.requestBodyJsonEditorNameChange, (state, { payload }) => {
			const node = state.tree[payload.requestId] as ValidRequestNode;
			const body = node.info.body as RequestBodyJson;
			if (!body.payload[payload.id]) return;
			(body.payload[payload.id] as NamedEntries).name = payload.name;
		})
		.addCase(actions.requestBodyJsonEditorValueChange, (state, { payload }) => {
			const node = state.tree[payload.requestId] as ValidRequestNode;
			const body = node.info.body as RequestBodyJson;
			if (!body.payload[payload.id]) return;
			(body.payload[payload.id] as ValueEntries).value = payload.value;
		})
		.addCase(actions.requestBodyJsonEditorTypeChange, (state, { payload }) => {
			const node = state.tree[payload.requestId] as ValidRequestNode;
			const body = node.info.body as RequestBodyJson;
			const entry = body.payload[payload.id];
			if (!entry) return;

			entry.type = payload.type;

			if (['array', 'object'].includes(payload.type)) {
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				(entry as any).value = void 0;
				return;
			}

			if (payload.type === 'boolean') (entry as ValueEntries).value = true;
			else if (payload.type === 'null') (entry as ValueEntries).value = null;
			else (entry as ValueEntries).value = [];

			body.payload = removeOrphanedJsonEntries(body.payload);
		})
		.addCase(actions.requestBodyJsonEditorEnabledChange, (state, { payload }) => {
			const node = state.tree[payload.requestId] as ValidRequestNode;
			const body = node.info.body as RequestBodyJson;
			if (!body.payload[payload.id]) return;
			body.payload[payload.id].enabled = payload.enabled;
		})
		.addCase(actions.requestBodyJsonEditorAddEntry, (state, { payload }) => {
			const node = state.tree[payload.requestId] as ValidRequestNode;
			const body = node.info.body as RequestBodyJson;
			const entry = body.payload[payload.id];
			if (!entry) return;

			const isRoot = entry.parentId === null;
			const allowsChildren = ['array', 'object'].includes(entry.type);
			if (!allowsChildren && isRoot) return;

			const newId = ksuid.generate('jsonentry').toString();
			body.payload[newId] = {
				id: newId,
				parentId: allowsChildren ? payload.id : entry.parentId,
				type: 'string',
				name: entry.type === 'array' ? void 0 : '',
				enabled: true,
				value: [],
			} as NamedStringEntry;
		})
		.addCase(actions.requestBodyJsonEditorRemoveEntry, (state, { payload }) => {
			const node = state.tree[payload.requestId] as ValidRequestNode;
			const body = node.info.body as RequestBodyJson;
			delete body.payload[payload.id];
			body.payload = removeOrphanedJsonEntries(body.payload);
		});
}

function buildUrlEncodedEditor(builder: ActionReducerMapBuilder<State>) {
	builder
		.addCase(actions.requestBodyUrlEncodedEditorNameChange, (state, { payload }) => {
			const node = state.tree[payload.requestId] as ValidRequestNode;
			const body = node.info.body as RequestBodyUrlEncodedForm;
			body.payload[payload.id].name = payload.name;
		})
		.addCase(actions.requestBodyUrlEncodedEditorValueChange, (state, { payload }) => {
			const node = state.tree[payload.requestId] as ValidRequestNode;
			const body = node.info.body as RequestBodyUrlEncodedForm;
			body.payload[payload.id].value = payload.value;
		})
		.addCase(actions.requestBodyUrlEncodedEditorEnabledChange, (state, { payload }) => {
			const node = state.tree[payload.requestId] as ValidRequestNode;
			const body = node.info.body as RequestBodyUrlEncodedForm;
			body.payload[payload.id].enabled = payload.enabled;
		})
		.addCase(actions.requestBodyUrlEncodedEditorAddItem, (state, { payload }) => {
			const node = state.tree[payload.requestId] as ValidRequestNode;
			const body = node.info.body as RequestBodyUrlEncodedForm;
			const id = ksuid.generate('urlencodeditem').toString();
			body.payload[id] = { name: '', value: [], enabled: true };
		})
		.addCase(actions.requestBodyUrlEncodedEditorRemoveItem, (state, { payload }) => {
			const node = state.tree[payload.requestId] as ValidRequestNode;
			const body = node.info.body as RequestBodyUrlEncodedForm;
			delete body.payload[payload.id];
		});
}

function buildGraphQlEditor(builder: ActionReducerMapBuilder<State>) {
	builder
		.addCase(actions.requestBodyGraphQlEditorQueryChanged, (state, action) => {
			const node = state.tree[action.payload.requestId] as ValidRequestNode;
			const body = node.info.body as RequestBodyGraphQl;
			body.payload.query = action.payload.query;
		})
		.addCase(actions.requestBodyGraphQlEditorNameChange, (state, { payload }) => {
			const node = state.tree[payload.requestId] as ValidRequestNode;
			const body = node.info.body as RequestBodyGraphQl;
			if (!body.payload.variables[payload.id]) return;
			(body.payload.variables[payload.id] as NamedEntries).name = payload.name;
		})
		.addCase(actions.requestBodyGraphQlEditorValueChange, (state, { payload }) => {
			const node = state.tree[payload.requestId] as ValidRequestNode;
			const body = node.info.body as RequestBodyGraphQl;
			if (!body.payload.variables[payload.id]) return;
			(body.payload.variables[payload.id] as ValueEntries).value = payload.value;
		})
		.addCase(actions.requestBodyGraphQlEditorTypeChange, (state, { payload }) => {
			const node = state.tree[payload.requestId] as ValidRequestNode;
			const body = node.info.body as RequestBodyGraphQl;
			const entry = body.payload.variables[payload.id];
			if (!entry) return;

			entry.type = payload.type;

			if (['array', 'object'].includes(payload.type)) {
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				(entry as any).value = void 0;
				return;
			}

			if (payload.type === 'boolean') (entry as ValueEntries).value = true;
			else if (payload.type === 'null') (entry as ValueEntries).value = null;
			else (entry as ValueEntries).value = [];

			body.payload.variables = removeOrphanedJsonEntries(body.payload.variables);
		})
		.addCase(actions.requestBodyGraphQlEditorEnabledChange, (state, { payload }) => {
			const node = state.tree[payload.requestId] as ValidRequestNode;
			const body = node.info.body as RequestBodyGraphQl;
			if (!body.payload.variables[payload.id]) return;
			body.payload.variables[payload.id].enabled = payload.enabled;
		})
		.addCase(actions.requestBodyGraphQlEditorAddEntry, (state, { payload }) => {
			const node = state.tree[payload.requestId] as ValidRequestNode;
			const body = node.info.body as RequestBodyGraphQl;
			const entry = body.payload.variables[payload.id];
			if (!entry) return;

			const isRoot = entry.parentId === null;
			const allowsChildren = ['array', 'object'].includes(entry.type);
			if (!allowsChildren && isRoot) return;

			const newId = ksuid.generate('jsonentry').toString();
			body.payload.variables[newId] = {
				id: newId,
				parentId: allowsChildren ? payload.id : entry.parentId,
				type: 'string',
				name: entry.type === 'array' ? void 0 : '',
				enabled: true,
				value: [],
			} as NamedStringEntry;
		})
		.addCase(actions.requestBodyGraphQlEditorRemoveEntry, (state, { payload }) => {
			const node = state.tree[payload.requestId] as ValidRequestNode;
			const body = node.info.body as RequestBodyGraphQl;
			delete body.payload.variables[payload.id];
			body.payload.variables = removeOrphanedJsonEntries(body.payload.variables);
		})
		.addCase(actions.requestBodyGraphQlEditorReconcileVariables, (state, { payload }) => {
			const node = state.tree[payload.requestId] as ValidRequestNode;
			const body = node.info.body as RequestBodyGraphQl;

			const extractedVariableNames = Object.keys(payload.variables);
			const variablesValues = Object.values(body.payload.variables) as NamedEntries[];
			const root = variablesValues.find(v => v.parentId === null);

			// GraphQL variable root must be `object`
			if (!root || root.type !== 'object') return;

			const existingVariablesSet = new Set(variablesValues.filter(v => v.parentId === root.id).map(v => v.name));
			const missingVariableNames = extractedVariableNames.filter(v => !existingVariablesSet.has(v));

			missingVariableNames.forEach(v => {
				const id = ksuid.generate('jsonentry').toString();
				const type = payload.variables[v];
				const value = (() => {
					switch (type) {
						case 'array':
						case 'object':
							return void 0;
						case 'boolean':
							return true;
						case 'null':
							return null;
						case 'number':
							return ['0'];
						default:
							return [''];
					}
				})();

				body.payload.variables[id] = {
					id,
					enabled: true,
					name: v,
					parentId: root.id,
					type: payload.variables[v],
					// @ts-expect-error
					value,
				};
			});
		});
}

function removeOrphanedJsonEntries(body: EntryMap) {
	const allRelevantIds = TypedObject.keys(body).reduce<string[]>((acc, k) => {
		const entry = body[k];
		if (entry && ['array', 'object'].includes(entry.type)) return [...acc, k];
		return acc;
	}, []);

	return TypedObject.keys(body).reduce<EntryMap>((acc, k) => {
		const entry = body[k];
		if (entry.parentId === null || allRelevantIds.includes(entry.parentId)) return { ...acc, [k]: entry };
		return acc;
	}, {});
}
