import { Nodes } from '@beak/common/types/beak-project';
import { createAction } from '@reduxjs/toolkit';

import {
	ActionTypes,
	ProjectOpenedPayload,
	RequestBodyJsonChangedPayload,
	RequestBodyTextChangedPayload,
	RequestRenameCancelled,
	RequestRenameResolved,
	RequestRenameStarted,
	RequestRenameSubmitted,
	RequestRenameUpdated,
	RequestUriUpdatedPayload,
	ToggleableItemAddedPayload,
	ToggleableItemRemovedPayload,
	ToggleableItemUpdatedPayload,
} from './types';

export const openProject = createAction<string>(ActionTypes.OPEN_PROJECT);
export const projectOpened = createAction<ProjectOpenedPayload>(ActionTypes.PROJECT_OPENED);
export const requestSelected = createAction<string | undefined>(ActionTypes.REQUEST_SELECTED);
export const requestUriUpdated = createAction<RequestUriUpdatedPayload>(ActionTypes.REQUEST_URI_UPDATED);

export const requestQueryAdded = createAction<ToggleableItemAddedPayload>(ActionTypes.REQUEST_QUERY_ADDED);
export const requestQueryUpdated = createAction<ToggleableItemUpdatedPayload>(ActionTypes.REQUEST_QUERY_UPDATED);
export const requestQueryRemoved = createAction<ToggleableItemRemovedPayload>(ActionTypes.REQUEST_QUERY_REMOVED);

export const requestHeaderAdded = createAction<ToggleableItemAddedPayload>(ActionTypes.REQUEST_HEADER_ADDED);
export const requestHeaderUpdated = createAction<ToggleableItemUpdatedPayload>(ActionTypes.REQUEST_HEADER_UPDATED);
export const requestHeaderRemoved = createAction<ToggleableItemRemovedPayload>(ActionTypes.REQUEST_HEADER_REMOVED);

export const requestBodyTextChanged = createAction<RequestBodyTextChangedPayload>(
	ActionTypes.REQUEST_BODY_TEXT_CHANGED,
);
export const requestBodyJsonChanged = createAction<RequestBodyJsonChangedPayload>(
	ActionTypes.REQUEST_BODY_JSON_CHANGED,
);

export const reportNodeUpdate = createAction<string>(ActionTypes.REPORT_NODE_UPDATE);
export const startFsListener = createAction(ActionTypes.START_FS_LISTENER);

export const refreshNodeState = createAction<Nodes>(ActionTypes.REFRESH_NODE_STATE);
export const insertRequestNode = createAction<Nodes>(ActionTypes.INSERT_REQUEST_NODE);
export const removeRequestNode = createAction<string>(ActionTypes.REMOVE_REQUEST_NODE);

export const requestRenameStarted = createAction<RequestRenameStarted>(ActionTypes.REQUEST_RENAME_STARTED);
export const requestRenameUpdated = createAction<RequestRenameUpdated>(ActionTypes.REQUEST_RENAME_UPDATED);
export const requestRenameCancelled = createAction<RequestRenameCancelled>(ActionTypes.REQUEST_RENAME_CANCELLED);
export const requestRenameSubmitted = createAction<RequestRenameSubmitted>(ActionTypes.REQUEST_RENAME_SUBMITTED);
export const requestRenameResolved = createAction<RequestRenameResolved>(ActionTypes.REQUEST_RENAME_RESOLVED);

export default {
	openProject,
	projectOpened,
	requestSelected,
	requestUriUpdated,

	requestQueryAdded,
	requestQueryUpdated,
	requestQueryRemoved,

	requestHeaderAdded,
	requestHeaderUpdated,
	requestHeaderRemoved,

	requestBodyTextChanged,
	requestBodyJsonChanged,

	reportNodeUpdate,
	startFsListener,

	refreshNodeState,
	insertRequestNode,
	removeRequestNode,

	requestRenameStarted,
	requestRenameUpdated,
	requestRenameCancelled,
	requestRenameSubmitted,
	requestRenameResolved,
};
