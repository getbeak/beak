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
	type AlertInsertPayload,
	type AlertScopeMatch,
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
	type RequestBodyGrpcMetadataChangedPayload,
	type RequestBodyGrpcRequestJsonChangedPayload,
	type RequestBodyJsonEditorAddEntryPayload,
	type RequestBodyJsonEditorDescriptionChangePayload,
	type RequestBodyJsonEditorEnabledChangePayload,
	type RequestBodyJsonEditorMoveEntryPayload,
	type RequestBodyJsonEditorNameChangePayload,
	type RequestBodyJsonEditorOptionsChangePayload,
	type RequestBodyJsonEditorRemoveEntryPayload,
	type RequestBodyJsonEditorReplacePayloadPayload,
	type RequestBodyJsonEditorRequiredChangePayload,
	type RequestBodyJsonEditorTypeChangePayload,
	type RequestBodyJsonEditorValueChangePayload,
	type RequestBodyJsonRawChangedPayload,
	type RequestBodyTextChangedPayload,
	type RequestBodyTypeChangedPayload,
	type RequestBodyUrlEncodedEditorAddItemPayload,
	type RequestBodyUrlEncodedEditorEnabledChangePayload,
	type RequestBodyUrlEncodedEditorNameChangePayload,
	type RequestBodyUrlEncodedEditorRemoveItemPayload,
	type RequestBodyUrlEncodedEditorValueChangePayload,
	type RequestIdPayload,
	type RequestOptionDecompressResponse,
	type RequestOptionFollowRedirects,
	type RequestOptionMaxRedirects,
	type RequestOptionSendCookies,
	type RequestOptionTimeoutMs,
	type RequestOptionToggleAdditionalCookieJar,
	type RequestRenameCancelled,
	type RequestRenameResolved,
	type RequestRenameStarted,
	type RequestRenameSubmitted,
	type RequestRenameUpdated,
	type RequestUriUpdatedPayload,
	type SetPrimaryCookieJarPayload,
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

export const linkedDirtyMarked = createAction<RequestIdPayload>(AT.LINKED_DIRTY_MARKED);
export const linkedDirtyCleared = createAction<RequestIdPayload>(AT.LINKED_DIRTY_CLEARED);
export const linkedStaleMarked = createAction<RequestIdPayload>(AT.LINKED_STALE_MARKED);
export const linkedStaleCleared = createAction<RequestIdPayload>(AT.LINKED_STALE_CLEARED);

/** User picked "Rename + Unlink" in the close-tab dialog. */
export const unlinkAndRename = createAction<RequestIdPayload>(AT.UNLINK_AND_RENAME);
/** Re-fetch from disk: drop in-memory edits, snap back to spec output. */
export const relinkRequest = createAction<RequestIdPayload>(AT.RELINK_REQUEST);
/** Stale-reload dialog: accept the disk version. */
export const reloadStaleRequest = createAction<RequestIdPayload>(AT.RELOAD_STALE_REQUEST);
/** Stale-reload dialog: keep my in-memory version, ignore disk change. */
export const keepLocalStaleRequest = createAction<RequestIdPayload>(AT.KEEP_LOCAL_STALE_REQUEST);

/**
 * UI-initiated tab close. Routes through the linked-dirty gate: dirty
 * linked requests open the unlink-confirm dialog; everything else closes
 * directly. Pass `undefined` to target the currently-selected tab.
 */
export const closeTabIntent = createAction<string | undefined>(AT.CLOSE_TAB_INTENT);
export const unlinkConfirmShow = createAction<RequestIdPayload>(AT.UNLINK_CONFIRM_SHOW);
export const unlinkConfirmDismiss = createAction(AT.UNLINK_CONFIRM_DISMISS);
export const staleReloadShow = createAction<RequestIdPayload>(AT.STALE_RELOAD_SHOW);
export const staleReloadDismiss = createAction(AT.STALE_RELOAD_DISMISS);

export const requestBodyTypeChanged = createAction<RequestBodyTypeChangedPayload>(AT.REQUEST_BODY_TYPE_CHANGED);
export const requestBodyTextChanged = createAction<RequestBodyTextChangedPayload>(AT.REQUEST_BODY_TEXT_CHANGED);
export const requestBodyJsonRawChanged = createAction<RequestBodyJsonRawChangedPayload>(
	AT.REQUEST_BODY_JSON_RAW_CHANGED,
);
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
export const requestBodyJsonEditorDescriptionChange = createAction<RequestBodyJsonEditorDescriptionChangePayload>(
	AT.REQUEST_BODY_JSON_EDITOR_DESCRIPTION_CHANGE,
);
export const requestBodyJsonEditorRequiredChange = createAction<RequestBodyJsonEditorRequiredChangePayload>(
	AT.REQUEST_BODY_JSON_EDITOR_REQUIRED_CHANGE,
);
export const requestBodyJsonEditorOptionsChange = createAction<RequestBodyJsonEditorOptionsChangePayload>(
	AT.REQUEST_BODY_JSON_EDITOR_OPTIONS_CHANGE,
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
export const requestBodyJsonEditorReplacePayload = createAction<RequestBodyJsonEditorReplacePayloadPayload>(
	AT.REQUEST_BODY_JSON_EDITOR_REPLACE_PAYLOAD,
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

export const requestBodyGrpcRequestJsonChanged = createAction<RequestBodyGrpcRequestJsonChangedPayload>(
	AT.REQUEST_BODY_GRPC_REQUEST_JSON_CHANGED,
);
export const requestBodyGrpcMetadataChanged = createAction<RequestBodyGrpcMetadataChangedPayload>(
	AT.REQUEST_BODY_GRPC_METADATA_CHANGED,
);

export const requestOptionFollowRedirects = createAction<RequestOptionFollowRedirects>(
	AT.REQUEST_OPTION_FOLLOW_REDIRECTS,
);
export const requestOptionDecompressResponse = createAction<RequestOptionDecompressResponse>(
	AT.REQUEST_OPTION_DECOMPRESS_RESPONSE,
);
export const requestOptionTimeoutMs = createAction<RequestOptionTimeoutMs>(AT.REQUEST_OPTION_TIMEOUT_MS);
export const requestOptionMaxRedirects = createAction<RequestOptionMaxRedirects>(AT.REQUEST_OPTION_MAX_REDIRECTS);
export const requestOptionSendCookies = createAction<RequestOptionSendCookies>(AT.REQUEST_OPTION_SEND_COOKIES);
export const requestOptionToggleAdditionalCookieJar = createAction<RequestOptionToggleAdditionalCookieJar>(
	AT.REQUEST_OPTION_TOGGLE_ADDITIONAL_COOKIE_JAR,
);
export const setPrimaryCookieJar = createAction<SetPrimaryCookieJarPayload>(AT.SET_PRIMARY_COOKIE_JAR);

export const alertInsert = createAction<AlertInsertPayload>(AT.ALERTS_INSERT);
export const alertRemove = createAction<string>(AT.ALERTS_REMOVE);
export const alertRemoveForScope = createAction<AlertScopeMatch>(AT.ALERTS_REMOVE_FOR_SCOPE);
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

	linkedDirtyMarked,
	linkedDirtyCleared,
	linkedStaleMarked,
	linkedStaleCleared,

	unlinkAndRename,
	relinkRequest,
	reloadStaleRequest,
	keepLocalStaleRequest,

	closeTabIntent,
	unlinkConfirmShow,
	unlinkConfirmDismiss,
	staleReloadShow,
	staleReloadDismiss,

	requestBodyTypeChanged,
	requestBodyTextChanged,
	requestBodyJsonRawChanged,
	requestBodyFileChanged,
	requestBodyAssetChanged,

	requestBodyJsonEditorNameChange,
	requestBodyJsonEditorValueChange,
	requestBodyJsonEditorTypeChange,
	requestBodyJsonEditorEnabledChange,
	requestBodyJsonEditorDescriptionChange,
	requestBodyJsonEditorRequiredChange,
	requestBodyJsonEditorOptionsChange,
	requestBodyJsonEditorAddEntry,
	requestBodyJsonEditorRemoveEntry,
	requestBodyJsonEditorMoveEntry,
	requestBodyJsonEditorReplacePayload,

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
	requestOptionDecompressResponse,
	requestOptionTimeoutMs,
	requestOptionMaxRedirects,
	requestOptionSendCookies,
	requestOptionToggleAdditionalCookieJar,
	setPrimaryCookieJar,

	alertInsert,
	alertRemove,
	alertRemoveForScope,
	alertRemoveType,
	alertClear,

	revealRequestExternal,
};
