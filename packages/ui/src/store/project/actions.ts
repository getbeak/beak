import {
	insertFolderNode,
	insertProjectInfo,
	insertRequestNode,
	projectOpened,
	removeNodeFromStore,
	removeNodeFromStoreByPath,
	startProject,
} from '@beak/state/project';
import { createAction } from '@reduxjs/toolkit';

// Pure tree actions live in @beak/state. Re-export them so existing UI imports keep working —
// new code should import from @beak/state/project directly.
export {
	insertFolderNode,
	insertProjectInfo,
	insertRequestNode,
	projectOpened,
	removeNodeFromStore,
	removeNodeFromStoreByPath,
	startProject,
};

import {
	type AlertDependencies,
	type AlertInsertPayload,
	ActionTypes as AT,
	type CreateNewThing,
	type DuplicateRequestPayload,
	type LatestWrite,
	type MoveNodeOnDiskPayload,
	type RemoveNodeFromDiskPayload,
	type RequestBodyAssetChangedPayload,
	type RequestBodyFileChangedPayload,
	type RequestBodyGraphQlEditorQueryChangedPayload,
	type RequestBodyGraphQlEditorReconcileVariablesPayload,
	type RequestBodyJsonEditorAddEntryPayload,
	type RequestBodyJsonEditorEnabledChangePayload,
	type RequestBodyJsonEditorMoveEntryPayload,
	type RequestBodyJsonEditorNameChangePayload,
	type RequestBodyJsonEditorRemoveEntryPayload,
	type RequestBodyJsonEditorTypeChangePayload,
	type RequestBodyJsonEditorValueChangePayload,
	type RequestBodyTextChangedPayload,
	type RequestBodyTypeChangedPayload,
	type RequestBodyUrlEncodedEditorAddItemPayload,
	type RequestBodyUrlEncodedEditorEnabledChangePayload,
	type RequestBodyUrlEncodedEditorNameChangePayload,
	type RequestBodyUrlEncodedEditorRemoveItemPayload,
	type RequestBodyUrlEncodedEditorValueChangePayload,
	type RequestOptionFollowRedirects,
	type RequestRenameCancelled,
	type RequestRenameResolved,
	type RequestRenameStarted,
	type RequestRenameSubmitted,
	type RequestRenameUpdated,
	type RequestUriUpdatedPayload,
	type ToggleableItemAddedPayload,
	type ToggleableItemRemovedPayload,
	type ToggleableItemUpdatedPayload,
	type WriteDebouncePayload,
} from './types';

export const requestUriUpdated = createAction<RequestUriUpdatedPayload>(AT.REQUEST_URI_UPDATED);

export const requestQueryAdded = createAction<ToggleableItemAddedPayload>(AT.REQUEST_QUERY_ADDED);
export const requestQueryUpdated = createAction<ToggleableItemUpdatedPayload>(AT.REQUEST_QUERY_UPDATED);
export const requestQueryRemoved = createAction<ToggleableItemRemovedPayload>(AT.REQUEST_QUERY_REMOVED);

export const requestHeaderAdded = createAction<ToggleableItemAddedPayload>(AT.REQUEST_HEADER_ADDED);
export const requestHeaderUpdated = createAction<ToggleableItemUpdatedPayload>(AT.REQUEST_HEADER_UPDATED);
export const requestHeaderRemoved = createAction<ToggleableItemRemovedPayload>(AT.REQUEST_HEADER_REMOVED);

export const duplicateRequest = createAction<DuplicateRequestPayload>(AT.DUPLICATE_REQUEST);

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
export const requestBodyAssetChanged = createAction<RequestBodyAssetChangedPayload>(AT.REQUEST_BODY_ASSET_CHANGED);

export const requestBodyJsonEditorNameChange = createAction<RequestBodyJsonEditorNameChangePayload>(
	AT.REQUEST_BODY_JSON_EDITOR_NAME_CHANGE,
);
export const requestBodyJsonEditorValueChange = createAction<RequestBodyJsonEditorValueChangePayload>(
	AT.REQUEST_BODY_JSON_EDITOR_VALUE_CHANGE,
);
export const requestBodyJsonEditorTypeChange = createAction<RequestBodyJsonEditorTypeChangePayload>(
	AT.REQUEST_BODY_JSON_EDITOR_TYPE_CHANGE,
);
export const requestBodyJsonEditorEnabledChange = createAction<RequestBodyJsonEditorEnabledChangePayload>(
	AT.REQUEST_BODY_JSON_EDITOR_ENABLED_CHANGE,
);
export const requestBodyJsonEditorAddEntry = createAction<RequestBodyJsonEditorAddEntryPayload>(
	AT.REQUEST_BODY_JSON_EDITOR_ADD_ENTRY,
);
export const requestBodyJsonEditorRemoveEntry = createAction<RequestBodyJsonEditorRemoveEntryPayload>(
	AT.REQUEST_BODY_JSON_EDITOR_REMOVE_ENTRY,
);
export const requestBodyJsonEditorMoveEntry = createAction<RequestBodyJsonEditorMoveEntryPayload>(
	AT.REQUEST_BODY_JSON_EDITOR_MOVE_ENTRY,
);

export const requestBodyUrlEncodedEditorNameChange = createAction<RequestBodyUrlEncodedEditorNameChangePayload>(
	AT.REQUEST_BODY_URL_ENCODED_EDITOR_NAME_CHANGE,
);
export const requestBodyUrlEncodedEditorValueChange = createAction<RequestBodyUrlEncodedEditorValueChangePayload>(
	AT.REQUEST_BODY_URL_ENCODED_EDITOR_VALUE_CHANGE,
);
export const requestBodyUrlEncodedEditorEnabledChange = createAction<RequestBodyUrlEncodedEditorEnabledChangePayload>(
	AT.REQUEST_BODY_URL_ENCODED_EDITOR_ENABLED_CHANGE,
);
export const requestBodyUrlEncodedEditorAddItem = createAction<RequestBodyUrlEncodedEditorAddItemPayload>(
	AT.REQUEST_BODY_URL_ENCODED_EDITOR_ADD_ITEM,
);
export const requestBodyUrlEncodedEditorRemoveItem = createAction<RequestBodyUrlEncodedEditorRemoveItemPayload>(
	AT.REQUEST_BODY_URL_ENCODED_EDITOR_REMOVE_ITEM,
);

export const requestBodyGraphQlEditorQueryChanged = createAction<RequestBodyGraphQlEditorQueryChangedPayload>(
	AT.REQUEST_BODY_GRAPHQL_EDITOR_QUERY_CHANGED,
);
export const requestBodyGraphQlEditorNameChange = createAction<RequestBodyJsonEditorNameChangePayload>(
	AT.REQUEST_BODY_GRAPHQL_EDITOR_VARIABLE_NAME_CHANGE,
);
export const requestBodyGraphQlEditorValueChange = createAction<RequestBodyJsonEditorValueChangePayload>(
	AT.REQUEST_BODY_GRAPHQL_EDITOR_VARIABLE_VALUE_CHANGE,
);
export const requestBodyGraphQlEditorTypeChange = createAction<RequestBodyJsonEditorTypeChangePayload>(
	AT.REQUEST_BODY_GRAPHQL_EDITOR_VARIABLE_TYPE_CHANGE,
);
export const requestBodyGraphQlEditorEnabledChange = createAction<RequestBodyJsonEditorEnabledChangePayload>(
	AT.REQUEST_BODY_GRAPHQL_EDITOR_VARIABLE_ENABLED_CHANGE,
);
export const requestBodyGraphQlEditorAddEntry = createAction<RequestBodyJsonEditorAddEntryPayload>(
	AT.REQUEST_BODY_GRAPHQL_EDITOR_VARIABLE_ADD_ENTRY,
);
export const requestBodyGraphQlEditorRemoveEntry = createAction<RequestBodyJsonEditorRemoveEntryPayload>(
	AT.REQUEST_BODY_GRAPHQL_EDITOR_VARIABLE_REMOVE_ENTRY,
);
export const requestBodyGraphQlEditorReconcileVariables =
	createAction<RequestBodyGraphQlEditorReconcileVariablesPayload>(AT.REQUEST_BODY_GRAPHQL_EDITOR_RECONCILE_VARIABLES);

export const requestOptionFollowRedirects = createAction<RequestOptionFollowRedirects>(
	AT.REQUEST_OPTION_FOLLOW_REDIRECTS,
);

export const alertInsert = createAction<AlertInsertPayload>(AT.ALERTS_INSERT);
export const alertRemove = createAction<string>(AT.ALERTS_REMOVE);
export const alertRemoveDependents = createAction<AlertDependencies>(AT.ALERTS_REMOVE_DEPENDENTS);
export const alertRemoveType = createAction<string>(AT.ALERTS_REMOVE_TYPE);
export const alertClear = createAction(AT.ALERTS_CLEAR);

export const revealRequestExternal = createAction<string>(AT.REVEAL_REQUEST_EXTERNAL);

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
	requestBodyAssetChanged,

	requestBodyJsonEditorNameChange,
	requestBodyJsonEditorValueChange,
	requestBodyJsonEditorTypeChange,
	requestBodyJsonEditorEnabledChange,
	requestBodyJsonEditorAddEntry,
	requestBodyJsonEditorRemoveEntry,
	requestBodyJsonEditorMoveEntry,

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
};
