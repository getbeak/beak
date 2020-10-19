import { Nodes } from '@beak/common/src/beak-project/types';
import { createAction } from '@reduxjs/toolkit';

import {
	ActionTypes,
	ProjectOpenedPayload,
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

export const reportNodeUpdate = createAction<string>(ActionTypes.REPORT_NODE_UPDATE);
export const refreshNodeState = createAction<Nodes>(ActionTypes.REFRESH_NODE_STATE);
export const startFsListener = createAction(ActionTypes.START_FS_LISTENER);

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
	reportNodeUpdate,
	refreshNodeState,
	startFsListener,
};
