/* eslint-disable max-len */
import type { Nodes } from '@getbeak/types/nodes';
import { createAction } from '@reduxjs/toolkit';

import {
	ActionTypes as AT,
	AlertDependencies,
	AlertInsertPayload,
	CreateNewThing,
	DuplicateRequestPayload,
	LatestWrite,
	MoveNodeOnDiskPayload,
	ProjectInfoPayload,
	ProjectOpenedPayload,
	RemoveNodeFromDiskPayload,
	RequestBodyFileChangedPayload,
	RequestBodyGraphQlEditorQueryChangedPayload,
	RequestBodyGraphQlEditorReconcileVariablesPayload,
	RequestBodyJsonEditorAddEntryPayload,
	RequestBodyJsonEditorEnabledChangePayload,
	RequestBodyJsonEditorNameChangePayload,
	RequestBodyJsonEditorRemoveEntryPayload,
	RequestBodyJsonEditorTypeChangePayload,
	RequestBodyJsonEditorValueChangePayload,
	RequestBodyTextChangedPayload,
	RequestBodyTypeChangedPayload,
	RequestBodyUrlEncodedEditorAddItemPayload,
	RequestBodyUrlEncodedEditorEnabledChangePayload,
	RequestBodyUrlEncodedEditorNameChangePayload,
	RequestBodyUrlEncodedEditorRemoveItemPayload,
	RequestBodyUrlEncodedEditorValueChangePayload,
	RequestOptionFollowRedirects,
	RequestRenameCancelled,
	RequestRenameResolved,
	RequestRenameStarted,
	RequestRenameSubmitted,
	RequestRenameUpdated,
	RequestUriUpdatedPayload,
	ToggleableItemAddedPayload,
	ToggleableItemRemovedPayload,
	ToggleableItemUpdatedPayload,
	WriteDebouncePayload,
} from './types';

export const startProject = createAction(AT.START_PROJECT);
export const insertProjectInfo = createAction<ProjectInfoPayload>(AT.INSERT_PROJECT_INFO);
export const projectOpened = createAction<ProjectOpenedPayload>(AT.PROJECT_OPENED);

export const requestUriUpdated = createAction<RequestUriUpdatedPayload>(AT.REQUEST_URI_UPDATED);

export const requestQueryAdded = createAction<ToggleableItemAddedPayload>(AT.REQUEST_QUERY_ADDED);
export const requestQueryUpdated = createAction<ToggleableItemUpdatedPayload>(AT.REQUEST_QUERY_UPDATED);
export const requestQueryRemoved = createAction<ToggleableItemRemovedPayload>(AT.REQUEST_QUERY_REMOVED);

export const requestHeaderAdded = createAction<ToggleableItemAddedPayload>(AT.REQUEST_HEADER_ADDED);
export const requestHeaderUpdated = createAction<ToggleableItemUpdatedPayload>(AT.REQUEST_HEADER_UPDATED);
export const requestHeaderRemoved = createAction<ToggleableItemRemovedPayload>(AT.REQUEST_HEADER_REMOVED);

export const duplicateRequest = createAction<DuplicateRequestPayload>(AT.DUPLICATE_REQUEST);
export const insertRequestNode = createAction<Nodes>(AT.INSERT_REQUEST_NODE);
export const insertFolderNode = createAction<Nodes>(AT.INSERT_FOLDER_NODE);

export const removeNodeFromStore = createAction<string>(AT.REMOVE_NODE_FROM_STORE);
export const removeNodeFromStoreByPath = createAction<string>(AT.REMOVE_NODE_FROM_STORE_BY_PATH);
export const removeNodeFromDisk = createAction<RemoveNodeFromDiskPayload>(AT.REMOVE_NODE_FROM_DISK);
export const moveNodeOnDisk = createAction<MoveNodeOnDiskPayload>(AT.MOVE_NODE_ON_DISK);

export const createNewRequest = createAction<CreateNewThing>(AT.CREATE_NEW_REQUEST);
export const createNewFolder = createAction<CreateNewThing>(AT.CREATE_NEW_FOLDER);

export const renameStarted = createAction<RequestRenameStarted>(AT.RENAME_STARTED);
export const renameUpdated = createAction<RequestRenameUpdated>(AT.RENAME_UPDATED);
export const renameCancelled = createAction<RequestRenameCancelled>(AT.RENAME_CANCELLED);
export const renameSubmitted = createAction<RequestRenameSubmitted>(AT.RENAME_SUBMITTED);
export const renameResolved = createAction<RequestRenameResolved>(AT.RENAME_RESOLVED);

export const setLatestWrite = createAction<LatestWrite>(AT.SET_LATEST_WRITE);
export const setWriteDebounce = createAction<WriteDebouncePayload>(AT.SET_WRITE_DEBOUNCE);

export const requestBodyTypeChanged = createAction<RequestBodyTypeChangedPayload>(AT.REQUEST_BODY_TYPE_CHANGED);
export const requestBodyTextChanged = createAction<RequestBodyTextChangedPayload>(AT.REQUEST_BODY_TEXT_CHANGED);
export const requestBodyFileChanged = createAction<RequestBodyFileChangedPayload>(AT.REQUEST_BODY_FILE_CHANGED);

export const requestBodyJsonEditorNameChange = createAction<RequestBodyJsonEditorNameChangePayload>(AT.REQUEST_BODY_JSON_EDITOR_NAME_CHANGE);
export const requestBodyJsonEditorValueChange = createAction<RequestBodyJsonEditorValueChangePayload>(AT.REQUEST_BODY_JSON_EDITOR_VALUE_CHANGE);
export const requestBodyJsonEditorTypeChange = createAction<RequestBodyJsonEditorTypeChangePayload>(AT.REQUEST_BODY_JSON_EDITOR_TYPE_CHANGE);
export const requestBodyJsonEditorEnabledChange = createAction<RequestBodyJsonEditorEnabledChangePayload>(AT.REQUEST_BODY_JSON_EDITOR_ENABLED_CHANGE);
export const requestBodyJsonEditorAddEntry = createAction<RequestBodyJsonEditorAddEntryPayload>(AT.REQUEST_BODY_JSON_EDITOR_ADD_ENTRY);
export const requestBodyJsonEditorRemoveEntry = createAction<RequestBodyJsonEditorRemoveEntryPayload>(AT.REQUEST_BODY_JSON_EDITOR_REMOVE_ENTRY);

export const requestBodyUrlEncodedEditorNameChange = createAction<RequestBodyUrlEncodedEditorNameChangePayload>(AT.REQUEST_BODY_URL_ENCODED_EDITOR_NAME_CHANGE);
export const requestBodyUrlEncodedEditorValueChange = createAction<RequestBodyUrlEncodedEditorValueChangePayload>(AT.REQUEST_BODY_URL_ENCODED_EDITOR_VALUE_CHANGE);
export const requestBodyUrlEncodedEditorEnabledChange = createAction<RequestBodyUrlEncodedEditorEnabledChangePayload>(AT.REQUEST_BODY_URL_ENCODED_EDITOR_ENABLED_CHANGE);
export const requestBodyUrlEncodedEditorAddItem = createAction<RequestBodyUrlEncodedEditorAddItemPayload>(AT.REQUEST_BODY_URL_ENCODED_EDITOR_ADD_ITEM);
export const requestBodyUrlEncodedEditorRemoveItem = createAction<RequestBodyUrlEncodedEditorRemoveItemPayload>(AT.REQUEST_BODY_URL_ENCODED_EDITOR_REMOVE_ITEM);

export const requestBodyGraphQlEditorQueryChanged = createAction<RequestBodyGraphQlEditorQueryChangedPayload>(AT.REQUEST_BODY_GRAPHQL_EDITOR_QUERY_CHANGED);
export const requestBodyGraphQlEditorNameChange = createAction<RequestBodyJsonEditorNameChangePayload>(AT.REQUEST_BODY_GRAPHQL_EDITOR_VARIABLE_NAME_CHANGE);
export const requestBodyGraphQlEditorValueChange = createAction<RequestBodyJsonEditorValueChangePayload>(AT.REQUEST_BODY_GRAPHQL_EDITOR_VARIABLE_VALUE_CHANGE);
export const requestBodyGraphQlEditorTypeChange = createAction<RequestBodyJsonEditorTypeChangePayload>(AT.REQUEST_BODY_GRAPHQL_EDITOR_VARIABLE_TYPE_CHANGE);
export const requestBodyGraphQlEditorEnabledChange = createAction<RequestBodyJsonEditorEnabledChangePayload>(AT.REQUEST_BODY_GRAPHQL_EDITOR_VARIABLE_ENABLED_CHANGE);
export const requestBodyGraphQlEditorAddEntry = createAction<RequestBodyJsonEditorAddEntryPayload>(AT.REQUEST_BODY_GRAPHQL_EDITOR_VARIABLE_ADD_ENTRY);
export const requestBodyGraphQlEditorRemoveEntry = createAction<RequestBodyJsonEditorRemoveEntryPayload>(AT.REQUEST_BODY_GRAPHQL_EDITOR_VARIABLE_REMOVE_ENTRY);
export const requestBodyGraphQlEditorReconcileVariables = createAction<RequestBodyGraphQlEditorReconcileVariablesPayload>(AT.REQUEST_BODY_GRAPHQL_EDITOR_RECONCILE_VARIABLES);

export const requestOptionFollowRedirects = createAction<RequestOptionFollowRedirects>(AT.REQUEST_OPTION_FOLLOW_REDIRECTS);

export const alertInsert = createAction<AlertInsertPayload>(AT.ALERTS_INSERT);
export const alertRemove = createAction<string>(AT.ALERTS_REMOVE);
export const alertRemoveDependents = createAction<AlertDependencies>(AT.ALERTS_REMOVE_DEPENDENTS);
export const alertRemoveType = createAction<string>(AT.ALERTS_REMOVE_TYPE);
export const alertClear = createAction(AT.ALERTS_CLEAR);

export const revealRequestExternal = createAction<string>(AT.REVEAL_REQUEST_EXTERNAL);

export const defaultOrCreateRequest = createAction(AT.DEFAULT_OR_CREATE_REQUEST);

export default {
	startProject,
	insertProjectInfo,
	projectOpened,

	requestUriUpdated,

	requestQueryAdded,
	requestQueryUpdated,
	requestQueryRemoved,

	requestHeaderAdded,
	requestHeaderUpdated,
	requestHeaderRemoved,

	duplicateRequest,
	insertRequestNode,
	insertFolderNode,

	removeNodeFromStore,
	removeNodeFromStoreByPath,
	removeNodeFromDisk,
	moveNodeOnDisk,

	createNewRequest,
	createNewFolder,

	renameStarted,
	renameUpdated,
	renameCancelled,
	renameSubmitted,
	renameResolved,

	setLatestWrite,
	setWriteDebounce,

	requestBodyTypeChanged,
	requestBodyTextChanged,
	requestBodyFileChanged,

	requestBodyJsonEditorNameChange,
	requestBodyJsonEditorValueChange,
	requestBodyJsonEditorTypeChange,
	requestBodyJsonEditorEnabledChange,
	requestBodyJsonEditorAddEntry,
	requestBodyJsonEditorRemoveEntry,

	requestBodyGraphQlEditorQueryChanged,
	requestBodyGraphQlEditorNameChange,
	requestBodyGraphQlEditorValueChange,
	requestBodyGraphQlEditorTypeChange,
	requestBodyGraphQlEditorEnabledChange,
	requestBodyGraphQlEditorAddEntry,
	requestBodyGraphQlEditorRemoveEntry,
	requestBodyGraphQlEditorReconcileVariables,

	requestBodyUrlEncodedEditorNameChange,
	requestBodyUrlEncodedEditorValueChange,
	requestBodyUrlEncodedEditorEnabledChange,
	requestBodyUrlEncodedEditorAddItem,
	requestBodyUrlEncodedEditorRemoveItem,

	requestOptionFollowRedirects,

	alertInsert,
	alertRemove,
	alertRemoveDependents,
	alertRemoveType,
	alertClear,

	revealRequestExternal,
	defaultOrCreateRequest,
};
