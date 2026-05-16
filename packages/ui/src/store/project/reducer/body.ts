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
		.addCase(actions.requestBodyJsonRawChanged, (state, action) => {
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
		.addCase(actions.requestBodyAssetChanged, (state, action) => {
			const node = state.tree[action.payload.requestId] as ValidRequestNode;
			// Preserve the existing payload (so legacy fileReferenceId / contentType
			// stay put if present) and mutate only the assetRef slot.
			const existing = (node.info.body.payload as Record<string, unknown> | undefined) ?? {};
			node.info.body.type = 'file';
			node.info.body.payload = {
				...existing,
				...(action.payload.assetRef ? { assetRef: action.payload.assetRef } : { assetRef: undefined }),
			};
		});

	buildJsonEditor(builder);
	buildUrlEncodedEditor(builder);
	buildGraphQlEditor(builder);
	buildGrpcEditor(builder);
}

function buildGrpcEditor(builder: ActionReducerMapBuilder<State>) {
	builder
		.addCase(actions.requestBodyGrpcRequestJsonChanged, (state, { payload }) => {
			const node = state.tree[payload.requestId] as ValidRequestNode;
			// Service / method are pinned on the request file at discovery time;
			// this action only ever touches the JSON body so we leave the rest
			// alone (and mass-assign would fight Immer's draft model anyway).
			const current = node.info.body.payload as {
				service: string;
				method: string;
				metadata?: Record<string, string>;
			};
			node.info.body.payload = {
				...current,
				requestJson: payload.requestJson,
			};
		})
		.addCase(actions.requestBodyGrpcMetadataChanged, (state, { payload }) => {
			const node = state.tree[payload.requestId] as ValidRequestNode;
			const current = node.info.body.payload as {
				service: string;
				method: string;
				requestJson: string;
				metadata?: Record<string, string>;
			};
			// Omit the field entirely when the map is empty so the on-disk file
			// stays small for the common "no metadata" case. The Zod schema
			// accepts both shapes.
			if (Object.keys(payload.metadata).length === 0) {
				const { metadata: _omitted, ...rest } = current;
				node.info.body.payload = rest;
			} else {
				node.info.body.payload = { ...current, metadata: payload.metadata };
			}
		});
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

			const previousType = entry.type;
			entry.type = payload.type;

			// Leaving 'enum' — drop the options field so the file diff doesn't
			// carry dead schema metadata.
			if (previousType === 'enum' && payload.type !== 'enum') {
				// biome-ignore lint/suspicious/noExplicitAny: structural cast — options only lives on EnumEntry
				delete (entry as any).options;
			}

			if (['array', 'object'].includes(payload.type)) {
				// biome-ignore lint/suspicious/noExplicitAny: array/object entries don't carry a value field; container entries store their children separately
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
		.addCase(actions.requestBodyJsonEditorDescriptionChange, (state, { payload }) => {
			const node = state.tree[payload.requestId] as ValidRequestNode;
			const body = node.info.body as RequestBodyJson;
			const entry = body.payload[payload.id];
			if (!entry) return;
			if (payload.description === null) delete entry.description;
			else entry.description = payload.description;
		})
		.addCase(actions.requestBodyJsonEditorRequiredChange, (state, { payload }) => {
			const node = state.tree[payload.requestId] as ValidRequestNode;
			const body = node.info.body as RequestBodyJson;
			const entry = body.payload[payload.id];
			if (!entry) return;
			if (payload.required === null) delete entry.required;
			else entry.required = payload.required;
		})
		.addCase(actions.requestBodyJsonEditorOptionsChange, (state, { payload }) => {
			const node = state.tree[payload.requestId] as ValidRequestNode;
			const body = node.info.body as RequestBodyJson;
			const entry = body.payload[payload.id];
			if (!entry || entry.type !== 'enum') return;
			if (payload.options === null) delete entry.options;
			else entry.options = payload.options;
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
		})
		.addCase(actions.requestBodyJsonEditorMoveEntry, (state, { payload }) => {
			const node = state.tree[payload.requestId] as ValidRequestNode;
			const body = node.info.body as RequestBodyJson;
			body.payload = moveJsonEntry(body.payload, payload.id, payload.targetId, payload.op);
		})
		.addCase(actions.requestBodyJsonEditorReplacePayload, (state, { payload }) => {
			const node = state.tree[payload.requestId] as ValidRequestNode;
			const body = node.info.body as RequestBodyJson;
			body.payload = payload.payload;
		});
}

function buildUrlEncodedEditor(builder: ActionReducerMapBuilder<State>) {
	builder
		.addCase(actions.requestBodyUrlEncodedEditorNameChange, (state, { payload }) => {
			const node = state.tree[payload.requestId] as ValidRequestNode;
			const body = node.info.body as RequestBodyUrlEncodedForm;
			if (!body.payload[payload.id]) return;
			body.payload[payload.id].name = payload.name;
		})
		.addCase(actions.requestBodyUrlEncodedEditorValueChange, (state, { payload }) => {
			const node = state.tree[payload.requestId] as ValidRequestNode;
			const body = node.info.body as RequestBodyUrlEncodedForm;
			if (!body.payload[payload.id]) return;
			body.payload[payload.id].value = payload.value;
		})
		.addCase(actions.requestBodyUrlEncodedEditorEnabledChange, (state, { payload }) => {
			const node = state.tree[payload.requestId] as ValidRequestNode;
			const body = node.info.body as RequestBodyUrlEncodedForm;
			if (!body.payload[payload.id]) return;
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
				// biome-ignore lint/suspicious/noExplicitAny: array/object entries don't carry a value field; container entries store their children separately
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

/**
 * Move a JSON entry inside the EntryMap. The map's natural iteration order is
 * the *visual* order of children, so reordering = rebuilding the map with the
 * desired key order while updating the moved entry's `parentId` where needed.
 *
 * Guard rails:
 * - Root entries can't be moved.
 * - Self-drops are no-ops.
 * - Dropping into the entry's own descendant subtree is rejected (would orphan
 *   the moved subtree).
 * - 'inside' is only honoured when target is an object or array.
 */
function moveJsonEntry(
	body: EntryMap,
	sourceId: string,
	targetId: string,
	op: 'before' | 'after' | 'inside',
): EntryMap {
	const source = body[sourceId];
	const target = body[targetId];
	if (!source || !target) return body;
	if (sourceId === targetId) return body;
	if (source.parentId === null) return body;
	if (op === 'inside' && !['array', 'object'].includes(target.type)) return body;

	// Build set of source's descendants so we can reject illegal drops.
	const descendants = new Set<string>([sourceId]);
	let changed = true;
	while (changed) {
		changed = false;
		for (const key of TypedObject.keys(body)) {
			const entry = body[key];
			if (entry.parentId && descendants.has(entry.parentId) && !descendants.has(key)) {
				descendants.add(key);
				changed = true;
			}
		}
	}
	if (descendants.has(targetId)) return body;

	const newParentId = op === 'inside' ? targetId : target.parentId;
	const movedEntry = { ...source, parentId: newParentId };

	// Rebuild the EntryMap. Keep every other entry in its current insertion
	// order so unrelated siblings don't shuffle. Drop `sourceId` from its old
	// position, then re-insert it at the right slot relative to `targetId`.
	const result: EntryMap = {};
	const keys = TypedObject.keys(body).filter(k => k !== sourceId);
	for (const key of keys) {
		if (key === targetId && op === 'before') result[sourceId] = movedEntry;
		result[key] = body[key];
		if (key === targetId && op === 'after') result[sourceId] = movedEntry;
	}
	if (op === 'inside') {
		// `inside` slots the moved entry as the last child of `targetId`. Drop it
		// after every existing child so users get an obvious "appended here"
		// signal — re-ordering within can happen with another drag.
		result[sourceId] = movedEntry;
	}

	return result;
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
