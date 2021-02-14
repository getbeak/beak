import { EntryType } from '@beak/common/types/beak-json-editor';
import { Tree, ValueParts } from '@beak/common/types/beak-project';

export const ActionTypes = {
	START_PROJECT: '@beak/global/project/START_PROJECT',
	INSERT_PROJECT_INFO: '@beak/global/project/INSERT_PROJECT_INFO',
	PROJECT_OPENED: '@beak/global/project/PROJECT_OPENED',

	TAB_SELECTED: '@beak/global/project/TAB_SELECTED',
	CLOSE_SELECTED_TAB: '@beak/global/project/CLOSE_SELECTED_TAB',
	CLOSE_OTHER_SELECTED_TABS: '@beak/global/project/CLOSE_OTHER_SELECTED_TABS',
	CLOSE_SELECTED_TABS_TO_RIGHT: '@beak/global/project/CLOSE_SELECTED_TABS_TO_RIGHT',
	CLOSE_SELECTED_TABS_TO_LEFT: '@beak/global/project/CLOSE_SELECTED_TABS_TO_LEFT',
	CLOSE_ALL_SELECTED_TABS: '@beak/global/project/CLOSE_ALL_SELECTED_TABS',
	SET_TAB_AS_PERMANENT: '@beak/global/project/SET_TAB_AS_PERMANENT',

	REQUEST_URI_UPDATED: '@beak/global/project/REQUEST_URI_UPDATED',

	REQUEST_QUERY_ADDED: '@beak/global/project/REQUEST_QUERY_ADDED',
	REQUEST_QUERY_UPDATED: '@beak/global/project/REQUEST_QUERY_UPDATED',
	REQUEST_QUERY_REMOVED: '@beak/global/project/REQUEST_QUERY_REMOVED',

	REQUEST_HEADER_ADDED: '@beak/global/project/REQUEST_HEADER_ADDED',
	REQUEST_HEADER_UPDATED: '@beak/global/project/REQUEST_HEADER_UPDATED',
	REQUEST_HEADER_REMOVED: '@beak/global/project/REQUEST_HEADER_REMOVED',


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

	SET_LATEST_WRITE: '@beak/global/project/SET_LATEST_WRITE',

	REQUEST_BODY_TYPE_CHANGED: '@beak/global/project/REQUEST_BODY_TYPE_CHANGED',
	REQUEST_BODY_TEXT_CHANGED: '@beak/global/project/REQUEST_BODY_TEXT_CHANGED',
	REQUEST_BODY_JSON_EDITOR_NAME_CHANGE: '@beak/global/project/REQUEST_BODY_JSON_EDITOR_NAME_CHANGE',
	REQUEST_BODY_JSON_EDITOR_VALUE_CHANGE: '@beak/global/project/REQUEST_BODY_JSON_EDITOR_VALUE_CHANGE',
	REQUEST_BODY_JSON_EDITOR_TYPE_CHANGE: '@beak/global/project/REQUEST_BODY_JSON_EDITOR_TYPE_CHANGE',
	REQUEST_BODY_JSON_EDITOR_ENABLED_CHANGE: '@beak/global/project/REQUEST_BODY_JSON_EDITOR_ENABLED_CHANGE',
	REQUEST_BODY_JSON_EDITOR_ADD_ENTRY: '@beak/global/project/REQUEST_BODY_JSON_EDITOR_ADD_ENTRY',
	REQUEST_BODY_JSON_EDITOR_REMOVE_ENTRY: '@beak/global/project/REQUEST_BODY_JSON_EDITOR_REMOVE_ENTRY',
};

export interface State {
	loaded: boolean;

	name?: string;
	projectPath?: string;
	projectTreePath?: string;
	tree: Tree;

	selectedTabPayload?: string;
	tabs: TabItem[];

	activeRename?: ActiveRename;
	latestWrite?: LatestWrite;
}

export const initialState: State = {
	loaded: false,

	tree: {},
	tabs: [],
};

export type TabItem = RequestTabItem | RendererTabItem;

export interface TabBase {
	temporary: boolean;
}

export interface RequestTabItem extends TabBase {
	type: 'request';
	payload: string;
}

export interface RendererTabItem extends TabBase {
	type: 'renderer';
	payload: 'variable_group_editor';
}

export interface ProjectInfoPayload {
	name: string;
	projectPath: string;
	treePath: string;
}

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

export interface LatestWrite {
	filePath: string;
	writtenAt: number;
}

export interface RequestBodyJsonEditorNameChangePayload extends RequestIdPayload {
	id: string;
	name: string;
}

export interface RequestBodyJsonEditorValueChangePayload extends RequestIdPayload {
	id: string;
	value: ValueParts | boolean | null;
}

export interface RequestBodyJsonEditorTypeChangePayload extends RequestIdPayload {
	id: string;
	type: EntryType;
}

export interface RequestBodyJsonEditorEnabledChangePayload extends RequestIdPayload {
	id: string;
	enabled: boolean;
}

export interface RequestBodyJsonEditorAddEntryPayload extends RequestIdPayload { id: string }
export interface RequestBodyJsonEditorRemoveEntryPayload extends RequestIdPayload { id: string }

export default {
	ActionTypes,
	initialState,
};
