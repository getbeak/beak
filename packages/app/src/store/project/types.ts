import { Nodes, Tree, ValueParts } from '@beak/common/types/beak-project';

export const ActionTypes = {
	START_PROJECT: '@beak/global/project/START_PROJECT',
	INSERT_PROJECT_INFO: '@beak/global/project/INSERT_PROJECT_INFO',
	INSERT_SCAN_ITEM: '@beak/global/project/INSERT_SCAN_ITEM',
	INITIAL_SCAN_COMPLETE: '@beak/global/project/INITIAL_SCAN_COMPLETE',
	PROJECT_OPENED: '@beak/global/project/PROJECT_OPENED',

	REQUEST_SELECTED: '@beak/global/project/REQUEST_SELECTED',

	REQUEST_URI_UPDATED: '@beak/global/project/REQUEST_URI_UPDATED',

	REQUEST_QUERY_ADDED: '@beak/global/project/REQUEST_QUERY_ADDED',
	REQUEST_QUERY_UPDATED: '@beak/global/project/REQUEST_QUERY_UPDATED',
	REQUEST_QUERY_REMOVED: '@beak/global/project/REQUEST_QUERY_REMOVED',

	REQUEST_HEADER_ADDED: '@beak/global/project/REQUEST_HEADER_ADDED',
	REQUEST_HEADER_UPDATED: '@beak/global/project/REQUEST_HEADER_UPDATED',
	REQUEST_HEADER_REMOVED: '@beak/global/project/REQUEST_HEADER_REMOVED',

	REQUEST_BODY_TEXT_CHANGED: '@beak/global/project/REQUEST_BODY_TEXT_CHANGED',
	REQUEST_BODY_JSON_CHANGED: '@beak/global/project/REQUEST_BODY_JSON_CHANGED',

	DUPLICATE_REQUEST: '@beak/global/project/DUPLICATE_REQUEST',
	INSERT_REQUEST_NODE: '@beak/global/project/INSERT_REQUEST_NODE',
	INSERT_FOLDER_NODE: '@beak/global/project/INSERT_FOLDER_NODE',

	REMOVE_NODE_FROM_STORE: '@beak/global/project/REMOVE_NODE_FROM_STORE',
	REMOVE_NODE_FROM_STORE_BY_PATH: '@beak/global/project/REMOVE_NODE_FROM_STORE_BY_PATH',
	REMOVE_NODE_FROM_DISK: '@beak/global/project/REMOVE_NODE_FROM_DISK',

	CREATE_NEW_REQUEST: '@beak/global/project/CREATE_NEW_REQUEST',
	CREATE_NEW_FOLDER: '@beak/global/project/CREATE_NEW_FOLDER',

	REQUEST_RENAME_STARTED: '@beak/global/project/REQUEST_RENAME_STARTED',
	REQUEST_RENAME_UPDATED: '@beak/global/project/REQUEST_RENAME_UPDATED',
	REQUEST_RENAME_CANCELLED: '@beak/global/project/REQUEST_RENAME_CANCELLED',
	REQUEST_RENAME_SUBMITTED: '@beak/global/project/REQUEST_RENAME_SUBMITTED',
	REQUEST_RENAME_RESOLVED: '@beak/global/project/REQUEST_RENAME_RESOLVED',
};

export interface State {
	loaded: boolean;
	initialScan: ScanEntryPayload[] | null;

	name?: string;
	projectPath?: string;
	projectTreePath?: string;
	tree: Tree;

	selectedRequest?: string;
	selectedRequests: string[];

	activeRename?: ActiveRename;
}

export const initialState: State = {
	loaded: false,
	initialScan: [],

	tree: {},
	selectedRequests: [],
};

export interface ProjectInfoPayload {
	name: string;
	projectPath: string;
	treePath: string;
}

export interface ScanEntryPayload {
	filePath: string;
	isDirectory: boolean;
}

export interface InitialScanCompletePayload { entries: ScanEntryPayload[] }
export interface ProjectOpenedPayload { tree: Tree }

export interface RequestIdPayload { requestId: string }

export interface RequestUriUpdatedPayload extends RequestIdPayload {
	url?: ValueParts;
	verb?: string;
}

export interface ToggleableItemAddedPayload extends RequestIdPayload {
	name?: string;
	value?: ValueParts;
}

export interface ToggleableItemUpdatedPayload extends RequestIdPayload {
	identifier: string;
	name?: string;
	value?: ValueParts;
	enabled?: boolean;
}

export interface ToggleableItemRemovedPayload extends RequestIdPayload {
	identifier: string;
}

export interface RequestBodyTextChangedPayload extends RequestIdPayload { text: string }
export interface RequestBodyJsonChangedPayload extends RequestIdPayload { json: string }

export interface RequestRenameStarted extends RequestIdPayload { }
export interface RequestRenameCancelled extends RequestIdPayload { }
export interface RequestRenameSubmitted extends RequestIdPayload { }
export interface RequestRenameResolved extends RequestIdPayload { }
export interface RequestRenameUpdated extends RequestIdPayload { name: string }

export interface DuplicateRequestPayload extends RequestIdPayload { }

export interface RemoveNodeFromDiskPayload extends RequestIdPayload {
	withConfirmation: boolean;
}

export interface CreateNewThing {
	highlightedNodeId: string;
	name?: string;
}

export interface ActiveRename {
	requestId: string;
	name: string;
}

export default {
	ActionTypes,
	initialState,
};
