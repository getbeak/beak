import { ValueParts } from '@beak/app/features/realtime-values/values';
import { ActiveRename } from '@beak/app/features/tree-view/types';
import Squawk from '@beak/common/utils/squawk';
import type { EntryMap, EntryType } from '@getbeak/types/body-editor-json';
import type { Tree } from '@getbeak/types/nodes';
import type { ToggleKeyValue } from '@getbeak/types/request';

export const ActionTypes = {
	START_PROJECT: '@beak/global/project/START_PROJECT',
	INSERT_PROJECT_INFO: '@beak/global/project/INSERT_PROJECT_INFO',
	PROJECT_OPENED: '@beak/global/project/PROJECT_OPENED',

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
	MOVE_NODE_ON_DISK: '@beak/global/project/MOVE_NODE_ON_DISK',

	CREATE_NEW_REQUEST: '@beak/global/project/CREATE_NEW_REQUEST',
	CREATE_NEW_FOLDER: '@beak/global/project/CREATE_NEW_FOLDER',

	RENAME_STARTED: '@beak/global/project/RENAME_STARTED',
	RENAME_UPDATED: '@beak/global/project/RENAME_UPDATED',
	RENAME_CANCELLED: '@beak/global/project/RENAME_CANCELLED',
	RENAME_SUBMITTED: '@beak/global/project/RENAME_SUBMITTED',
	RENAME_RESOLVED: '@beak/global/project/RENAME_RESOLVED',

	SET_LATEST_WRITE: '@beak/global/project/SET_LATEST_WRITE',
	SET_WRITE_DEBOUNCE: '@beak/global/project/SET_WRITE_DEBOUNCE',

	REQUEST_BODY_TYPE_CHANGED: '@beak/global/project/REQUEST_BODY_TYPE_CHANGED',
	REQUEST_BODY_TEXT_CHANGED: '@beak/global/project/REQUEST_BODY_TEXT_CHANGED',

	REQUEST_BODY_FILE_CHANGED: '@beak/global/project/REQUEST_BODY_FILE_CHANGED',

	REQUEST_BODY_JSON_EDITOR_NAME_CHANGE: '@beak/global/project/REQUEST_BODY_JSON_EDITOR_NAME_CHANGE',
	REQUEST_BODY_JSON_EDITOR_VALUE_CHANGE: '@beak/global/project/REQUEST_BODY_JSON_EDITOR_VALUE_CHANGE',
	REQUEST_BODY_JSON_EDITOR_TYPE_CHANGE: '@beak/global/project/REQUEST_BODY_JSON_EDITOR_TYPE_CHANGE',
	REQUEST_BODY_JSON_EDITOR_ENABLED_CHANGE: '@beak/global/project/REQUEST_BODY_JSON_EDITOR_ENABLED_CHANGE',
	REQUEST_BODY_JSON_EDITOR_ADD_ENTRY: '@beak/global/project/REQUEST_BODY_JSON_EDITOR_ADD_ENTRY',
	REQUEST_BODY_JSON_EDITOR_REMOVE_ENTRY: '@beak/global/project/REQUEST_BODY_JSON_EDITOR_REMOVE_ENTRY',

	REQUEST_BODY_URL_ENCODED_EDITOR_NAME_CHANGE: '@beak/global/project/REQUEST_BODY_URL_ENCODED_EDITOR_NAME_CHANGE',
	REQUEST_BODY_URL_ENCODED_EDITOR_VALUE_CHANGE: '@beak/global/project/REQUEST_BODY_URL_ENCODED_EDITOR_VALUE_CHANGE',
	REQUEST_BODY_URL_ENCODED_EDITOR_ADD_ITEM: '@beak/global/project/REQUEST_BODY_URL_ENCODED_EDITOR_ADD_ITEM',
	REQUEST_BODY_URL_ENCODED_EDITOR_REMOVE_ITEM: '@beak/global/project/REQUEST_BODY_URL_ENCODED_EDITOR_REMOVE_ITEM',
	REQUEST_BODY_URL_ENCODED_EDITOR_ENABLED_CHANGE: '@beak/global/project/REQUEST_BODY_URL_ENCODED_EDITOR_ENABLED_CHANGE',

	REQUEST_BODY_GRAPHQL_EDITOR_VARIABLE_NAME_CHANGE: '@beak/global/project/REQUEST_BODY_GRAPHQL_EDITOR_VARIABLE_NAME_CHANGE',
	REQUEST_BODY_GRAPHQL_EDITOR_VARIABLE_VALUE_CHANGE: '@beak/global/project/REQUEST_BODY_GRAPHQL_EDITOR_VARIABLE_VALUE_CHANGE',
	REQUEST_BODY_GRAPHQL_EDITOR_VARIABLE_TYPE_CHANGE: '@beak/global/project/REQUEST_BODY_GRAPHQL_EDITOR_VARIABLE_TYPE_CHANGE',
	REQUEST_BODY_GRAPHQL_EDITOR_VARIABLE_ENABLED_CHANGE: '@beak/global/project/REQUEST_BODY_GRAPHQL_EDITOR_VARIABLE_ENABLED_CHANGE',
	REQUEST_BODY_GRAPHQL_EDITOR_VARIABLE_ADD_ENTRY: '@beak/global/project/REQUEST_BODY_GRAPHQL_EDITOR_VARIABLE_ADD_ENTRY',
	REQUEST_BODY_GRAPHQL_EDITOR_VARIABLE_REMOVE_ENTRY: '@beak/global/project/REQUEST_BODY_GRAPHQL_EDITOR_VARIABLE_REMOVE_ENTRY',
	REQUEST_BODY_GRAPHQL_EDITOR_QUERY_CHANGED: '@beak/global/project/REQUEST_BODY_GRAPHQL_EDITOR_QUERY_CHANGED',

	REQUEST_OPTION_FOLLOW_REDIRECTS: '@beak/global/project/REQUEST_OPTION_FOLLOW_REDIRECTS',

	ALERTS_INSERT: '@beak/global/project/ALERTS_INSERT',
	ALERTS_REMOVE: '@beak/global/project/ALERTS_REMOVE',
	ALERTS_REMOVE_DEPENDENTS: '@beak/global/project/ALERTS_REMOVE_DEPENDENTS',
	ALERTS_REMOVE_TYPE: '@beak/global/project/ALERTS_REMOVE_TYPE',
	ALERTS_CLEAR: '@beak/global/project/ALERTS_CLEAR',

	REVEAL_REQUEST_EXTERNAL: '@beak/global/project/REVEAL_REQUEST_EXTERNAL',

	DEFAULT_OR_CREATE_REQUEST: '@beak/global/project/DEFAULT_OR_CREATE_REQUEST',
};

export interface State {
	loaded: boolean;

	id?: string;
	name?: string;
	tree: Tree;

	activeRename?: ActiveRename;
	latestWrite?: LatestWrite;
	writeDebouncer: Record<string, string>;

	alerts: Record<string, Alert | undefined>;
}

export const initialState: State = {
	loaded: false,

	tree: {},

	writeDebouncer: {},
	alerts: {},
};

export interface ProjectInfoPayload {
	name: string;
	id: string;
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

export interface RequestRenameStarted extends RequestIdPayload { }
export interface RequestRenameCancelled extends RequestIdPayload { }
export interface RequestRenameSubmitted extends RequestIdPayload { }
export interface RequestRenameResolved extends RequestIdPayload { }
export interface RequestRenameUpdated extends RequestIdPayload { name: string }

export interface DuplicateRequestPayload extends RequestIdPayload { }

export interface MoveNodeOnDiskPayload {
	sourceNodeId: string;
	destinationNodeId: string;
}

export interface RemoveNodeFromDiskPayload extends RequestIdPayload {
	withConfirmation: boolean;
}

export interface CreateNewThing {
	highlightedNodeId: string | undefined;
	name?: string;
}

export interface LatestWrite {
	filePath: string;
	writtenAt: number;
}

export interface WriteDebouncePayload extends RequestIdPayload {
	nonce: string;
}

export type RequestBodyTypeChangedPayload =
	| RequestBodyTypeToJsonPayload
	| RequestBodyTypeToTextPayload
	| RequestBodyTypeToUrlEncodedFormPayload
	| RequestBodyTypeToFilePayload
	| RequestBodyTypeToGraphQlPayload;

interface RequestBodyTypeToJsonPayload extends RequestIdPayload {
	type: 'json';
	payload: EntryMap;
}

interface RequestBodyTypeToTextPayload extends RequestIdPayload {
	type: 'text';
	payload: string;
}

interface RequestBodyTypeToUrlEncodedFormPayload extends RequestIdPayload {
	type: 'url_encoded_form';
	payload: Record<string, ToggleKeyValue>;
}

interface RequestBodyTypeToFilePayload extends RequestIdPayload {
	type: 'file';
	payload: {
		fileReferenceId?: string;
		contentType?: string;
	};
}

interface RequestBodyTypeToGraphQlPayload extends RequestIdPayload {
	type: 'graphql';
	payload: {
		query: string;
		variables: EntryMap;
	};
}

export interface RequestBodyTextChangedPayload extends RequestIdPayload { text: string }

export interface RequestBodyFileChangedPayload extends RequestIdPayload {
	fileReferenceId: string | undefined;
	contentType: string | undefined;
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

export interface RequestBodyUrlEncodedEditorNameChangePayload extends RequestIdPayload {
	id: string;
	name: string;
}

export interface RequestBodyUrlEncodedEditorValueChangePayload extends RequestIdPayload {
	id: string;
	value: ValueParts;
}

export interface RequestBodyUrlEncodedEditorEnabledChangePayload extends RequestIdPayload {
	id: string;
	enabled: boolean;
}

export interface RequestBodyUrlEncodedEditorAddItemPayload extends RequestIdPayload { }
export interface RequestBodyUrlEncodedEditorRemoveItemPayload extends RequestIdPayload { id: string }

export interface RequestBodyGraphQlEditorQueryChangedPayload extends RequestIdPayload { query: string }

export interface RequestOptionFollowRedirects extends RequestIdPayload { followRedirects: boolean }

export type Alert = AlertMissingEncryption | AlertHttpBodyNotAllowed | AlertInvalidExtension;

export interface AlertBase {
	type: string;
	dependencies?: AlertDependencies;
}

export interface AlertDependencies {
	requestId?: string;
}

export interface AlertMissingEncryption extends AlertBase {
	type: 'missing_encryption';
}

export interface AlertHttpBodyNotAllowed extends AlertBase {
	type: 'http_body_not_allowed';
}

export interface AlertInvalidExtension extends AlertBase {
	type: 'invalid_extension';
	payload: {
		error: Squawk;
		assumedName: string;
		filePath: string;
	};
}

export interface AlertInsertPayload {
	ident: string;
	alert: Alert;
}

export default {
	ActionTypes,
	initialState,
};
