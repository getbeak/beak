import type Squawk from '@beak/common/utils/squawk';
import type { SerializedSquawk } from '@beak/squawk';
import type { ProjectMode } from '@beak/state/project';
import type { ProjectCookieConfig } from '@beak/state/schemas';
import type { ExtractedVariables } from '@beak/ui/features/graphql-editor/types';
import type { ActiveRename } from '@beak/ui/features/tree-view/types';
import type { ValueSections } from '@beak/ui/features/variables/values';
import type { EntryMap, EntryType } from '@getbeak/types/body-editor-json';
import type { Tree } from '@getbeak/types/nodes';
import type { ScalarPropertyType, ToggleKeyValue } from '@getbeak/types/request';

export const ActionTypes = {
	REQUEST_URI_UPDATED: '@beak/global/project/REQUEST_URI_UPDATED',

	REQUEST_QUERY_ADDED: '@beak/global/project/REQUEST_QUERY_ADDED',
	REQUEST_QUERY_UPDATED: '@beak/global/project/REQUEST_QUERY_UPDATED',
	REQUEST_QUERY_REMOVED: '@beak/global/project/REQUEST_QUERY_REMOVED',

	REQUEST_HEADER_ADDED: '@beak/global/project/REQUEST_HEADER_ADDED',
	REQUEST_HEADER_UPDATED: '@beak/global/project/REQUEST_HEADER_UPDATED',
	REQUEST_HEADER_REMOVED: '@beak/global/project/REQUEST_HEADER_REMOVED',

	REQUEST_PATH_PARAMETER_VALUE_UPDATED: '@beak/global/project/REQUEST_PATH_PARAMETER_VALUE_UPDATED',

	DUPLICATE_REQUEST: '@beak/global/project/DUPLICATE_REQUEST',

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

	LINKED_DIRTY_MARKED: '@beak/global/project/LINKED_DIRTY_MARKED',
	LINKED_DIRTY_CLEARED: '@beak/global/project/LINKED_DIRTY_CLEARED',
	LINKED_STALE_MARKED: '@beak/global/project/LINKED_STALE_MARKED',
	LINKED_STALE_CLEARED: '@beak/global/project/LINKED_STALE_CLEARED',

	UNLINK_AND_RENAME: '@beak/global/project/UNLINK_AND_RENAME',
	RELINK_REQUEST: '@beak/global/project/RELINK_REQUEST',
	RELOAD_STALE_REQUEST: '@beak/global/project/RELOAD_STALE_REQUEST',
	KEEP_LOCAL_STALE_REQUEST: '@beak/global/project/KEEP_LOCAL_STALE_REQUEST',

	CLOSE_TAB_INTENT: '@beak/global/project/CLOSE_TAB_INTENT',
	UNLINK_CONFIRM_SHOW: '@beak/global/project/UNLINK_CONFIRM_SHOW',
	UNLINK_CONFIRM_DISMISS: '@beak/global/project/UNLINK_CONFIRM_DISMISS',
	STALE_RELOAD_SHOW: '@beak/global/project/STALE_RELOAD_SHOW',
	STALE_RELOAD_DISMISS: '@beak/global/project/STALE_RELOAD_DISMISS',

	REQUEST_BODY_TYPE_CHANGED: '@beak/global/project/REQUEST_BODY_TYPE_CHANGED',
	REQUEST_BODY_TEXT_CHANGED: '@beak/global/project/REQUEST_BODY_TEXT_CHANGED',
	REQUEST_BODY_JSON_RAW_CHANGED: '@beak/global/project/REQUEST_BODY_JSON_RAW_CHANGED',

	REQUEST_BODY_FILE_CHANGED: '@beak/global/project/REQUEST_BODY_FILE_CHANGED',
	REQUEST_BODY_ASSET_CHANGED: '@beak/global/project/REQUEST_BODY_ASSET_CHANGED',
	REQUEST_BODY_MULTIPART_CHANGED: '@beak/global/project/REQUEST_BODY_MULTIPART_CHANGED',

	REQUEST_BODY_JSON_EDITOR_NAME_CHANGE: '@beak/global/project/REQUEST_BODY_JSON_EDITOR_NAME_CHANGE',
	REQUEST_BODY_JSON_EDITOR_VALUE_CHANGE: '@beak/global/project/REQUEST_BODY_JSON_EDITOR_VALUE_CHANGE',
	REQUEST_BODY_JSON_EDITOR_TYPE_CHANGE: '@beak/global/project/REQUEST_BODY_JSON_EDITOR_TYPE_CHANGE',
	REQUEST_BODY_JSON_EDITOR_ENABLED_CHANGE: '@beak/global/project/REQUEST_BODY_JSON_EDITOR_ENABLED_CHANGE',
	REQUEST_BODY_JSON_EDITOR_DESCRIPTION_CHANGE: '@beak/global/project/REQUEST_BODY_JSON_EDITOR_DESCRIPTION_CHANGE',
	REQUEST_BODY_JSON_EDITOR_REQUIRED_CHANGE: '@beak/global/project/REQUEST_BODY_JSON_EDITOR_REQUIRED_CHANGE',
	REQUEST_BODY_JSON_EDITOR_OPTIONS_CHANGE: '@beak/global/project/REQUEST_BODY_JSON_EDITOR_OPTIONS_CHANGE',
	REQUEST_BODY_JSON_EDITOR_ADD_ENTRY: '@beak/global/project/REQUEST_BODY_JSON_EDITOR_ADD_ENTRY',
	REQUEST_BODY_JSON_EDITOR_REMOVE_ENTRY: '@beak/global/project/REQUEST_BODY_JSON_EDITOR_REMOVE_ENTRY',
	REQUEST_BODY_JSON_EDITOR_MOVE_ENTRY: '@beak/global/project/REQUEST_BODY_JSON_EDITOR_MOVE_ENTRY',
	REQUEST_BODY_JSON_EDITOR_REPLACE_PAYLOAD: '@beak/global/project/REQUEST_BODY_JSON_EDITOR_REPLACE_PAYLOAD',

	REQUEST_BODY_URL_ENCODED_EDITOR_NAME_CHANGE: '@beak/global/project/REQUEST_BODY_URL_ENCODED_EDITOR_NAME_CHANGE',
	REQUEST_BODY_URL_ENCODED_EDITOR_VALUE_CHANGE: '@beak/global/project/REQUEST_BODY_URL_ENCODED_EDITOR_VALUE_CHANGE',
	REQUEST_BODY_URL_ENCODED_EDITOR_ADD_ITEM: '@beak/global/project/REQUEST_BODY_URL_ENCODED_EDITOR_ADD_ITEM',
	REQUEST_BODY_URL_ENCODED_EDITOR_REMOVE_ITEM: '@beak/global/project/REQUEST_BODY_URL_ENCODED_EDITOR_REMOVE_ITEM',
	REQUEST_BODY_URL_ENCODED_EDITOR_ENABLED_CHANGE: '@beak/global/project/REQUEST_BODY_URL_ENCODED_EDITOR_ENABLED_CHANGE',

	REQUEST_BODY_GRAPHQL_EDITOR_QUERY_CHANGED: '@beak/global/project/REQUEST_BODY_GRAPHQL_EDITOR_QUERY_CHANGED',
	REQUEST_BODY_GRAPHQL_EDITOR_VARIABLE_NAME_CHANGE:
		'@beak/global/project/REQUEST_BODY_GRAPHQL_EDITOR_VARIABLE_NAME_CHANGE',
	REQUEST_BODY_GRAPHQL_EDITOR_VARIABLE_VALUE_CHANGE:
		'@beak/global/project/REQUEST_BODY_GRAPHQL_EDITOR_VARIABLE_VALUE_CHANGE',
	REQUEST_BODY_GRAPHQL_EDITOR_VARIABLE_TYPE_CHANGE:
		'@beak/global/project/REQUEST_BODY_GRAPHQL_EDITOR_VARIABLE_TYPE_CHANGE',
	REQUEST_BODY_GRAPHQL_EDITOR_VARIABLE_ENABLED_CHANGE:
		'@beak/global/project/REQUEST_BODY_GRAPHQL_EDITOR_VARIABLE_ENABLED_CHANGE',
	REQUEST_BODY_GRAPHQL_EDITOR_VARIABLE_ADD_ENTRY: '@beak/global/project/REQUEST_BODY_GRAPHQL_EDITOR_VARIABLE_ADD_ENTRY',
	REQUEST_BODY_GRAPHQL_EDITOR_VARIABLE_REMOVE_ENTRY:
		'@beak/global/project/REQUEST_BODY_GRAPHQL_EDITOR_VARIABLE_REMOVE_ENTRY',
	REQUEST_BODY_GRAPHQL_EDITOR_RECONCILE_VARIABLES:
		'@beak/global/project/REQUEST_BODY_GRAPHQL_EDITOR_RECONCILE_VARIABLES',

	REQUEST_BODY_GRPC_REQUEST_JSON_CHANGED: '@beak/global/project/REQUEST_BODY_GRPC_REQUEST_JSON_CHANGED',
	REQUEST_BODY_GRPC_METADATA_CHANGED: '@beak/global/project/REQUEST_BODY_GRPC_METADATA_CHANGED',

	REQUEST_OPTION_FOLLOW_REDIRECTS: '@beak/global/project/REQUEST_OPTION_FOLLOW_REDIRECTS',
	REQUEST_OPTION_DECOMPRESS_RESPONSE: '@beak/global/project/REQUEST_OPTION_DECOMPRESS_RESPONSE',
	REQUEST_OPTION_TIMEOUT_MS: '@beak/global/project/REQUEST_OPTION_TIMEOUT_MS',
	REQUEST_OPTION_MAX_REDIRECTS: '@beak/global/project/REQUEST_OPTION_MAX_REDIRECTS',
	REQUEST_OPTION_SEND_COOKIES: '@beak/global/project/REQUEST_OPTION_SEND_COOKIES',
	REQUEST_OPTION_TOGGLE_ADDITIONAL_COOKIE_JAR: '@beak/global/project/REQUEST_OPTION_TOGGLE_ADDITIONAL_COOKIE_JAR',
	SET_PRIMARY_COOKIE_JAR: '@beak/global/project/SET_PRIMARY_COOKIE_JAR',

	ALERTS_INSERT: '@beak/global/project/ALERTS_INSERT',
	ALERTS_REMOVE: '@beak/global/project/ALERTS_REMOVE',
	ALERTS_REMOVE_FOR_SCOPE: '@beak/global/project/ALERTS_REMOVE_FOR_SCOPE',
	ALERTS_REMOVE_TYPE: '@beak/global/project/ALERTS_REMOVE_TYPE',
	ALERTS_CLEAR: '@beak/global/project/ALERTS_CLEAR',

	REVEAL_REQUEST_EXTERNAL: '@beak/global/project/REVEAL_REQUEST_EXTERNAL',
};

export interface State {
	loaded: boolean;
	mode: ProjectMode;

	id?: string;
	name?: string;
	folderPath?: string;
	/**
	 * Project-wide cookie config (primary variable set, etc). Mirrors
	 * `project.json` → `cookies`. Used by the flight cookie resolver to
	 * pick the default jar.
	 */
	cookies?: ProjectCookieConfig;
	tree: Tree;

	activeRename?: ActiveRename;
	latestWrite?: LatestWrite;
	writeDebouncer: Record<string, string>;

	/**
	 * Linked (spec-generated) request files are read-only on disk: edits live
	 * here as a per-request dirty flag, and the project effect skips the
	 * debounced disk-write while the flag is set. The user resolves dirty
	 * state via the close-tab dialog (rename + unlink, or discard).
	 */
	linkedDirty: Record<string, boolean>;
	/**
	 * Marks a linked request whose underlying file changed on disk while a
	 * tab was open (typically because a re-sync clobbered it). The tab shows
	 * a stale indicator; refocusing the tab triggers the reconcile dialog.
	 */
	linkedStale: Record<string, boolean>;

	/** Pending close-tab confirm for a dirty linked request (modal). */
	pendingUnlinkConfirm?: { requestId: string };
	/** Pending stale-reload prompt for the focused tab (modal). */
	pendingStaleReload?: { requestId: string };

	/**
	 * Per-request opt-out: the user has explicitly removed an auto-managed
	 * Content-Type header, so the body-type reducer must not re-add one on
	 * subsequent type switches. In-memory only (resets on project reload).
	 */
	contentTypeOptOut: Record<string, boolean>;

	alerts: Record<string, Alert | undefined>;

	/**
	 * Set by the project loader when the initial load (or a retry) fails.
	 * The renderer shows `<ProjectLoadFailed>` while present so the user
	 * can see what went wrong instead of staring at the loading splash.
	 */
	loadError?: SerializedSquawk;
}

export const initialState: State = {
	loaded: false,
	mode: 'none',

	tree: {},

	writeDebouncer: {},
	linkedDirty: {},
	linkedStale: {},
	contentTypeOptOut: {},
	alerts: {},
};

// ProjectInfoPayload + ProjectOpenedPayload moved to @beak/state/project.

export interface RequestIdPayload {
	requestId: string;
}

export interface RequestUriUpdatedPayload extends RequestIdPayload {
	url?: ValueSections;
	verb?: string;
}

export interface ToggleableItemAddedPayload extends RequestIdPayload {
	name?: string;
	value?: ValueSections;
}

export interface ToggleableItemUpdatedPayload extends RequestIdPayload {
	identifier: string;
	name?: string;
	value?: ValueSections;
	enabled?: boolean;
	/** Schema metadata — set in schema mode. `null` clears the field. */
	type?: ScalarPropertyType | null;
	required?: boolean | null;
	description?: string | null;
	/**
	 * Enum options — typed primitives (`string | number | boolean | null`).
	 * `null` clears the list.
	 */
	options?: import('@getbeak/types/body-editor-json').EnumOption[] | null;
}

export interface ToggleableItemRemovedPayload extends RequestIdPayload {
	identifier: string;
}

/**
 * Update the bound value of a single path parameter. Keyed by `name` (the
 * `{name}` placeholder in the URL), not a synthetic identifier — path
 * params come from the spec and round-trip on re-sync, so a stable
 * spec-given name beats a generated id.
 */
export interface RequestPathParameterValueUpdatedPayload extends RequestIdPayload {
	name: string;
	value: ValueSections;
}

export interface RequestRenameStarted extends RequestIdPayload {
	/**
	 * Seed name for the inline editor. Optional: when omitted, the reducer
	 * pulls it from `tree[id].name`. Pass it explicitly for renames of nodes
	 * that don't live in the project tree (workflows are stored in their own
	 * slice and would otherwise be a tree-miss).
	 */
	name?: string;
}
export interface RequestRenameCancelled extends RequestIdPayload {}
export interface RequestRenameSubmitted extends RequestIdPayload {}
export interface RequestRenameResolved extends RequestIdPayload {}
export interface RequestRenameUpdated extends RequestIdPayload {
	name: string;
}

export interface DuplicateRequestPayload extends RequestIdPayload {}

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

// gRPC isn't part of this union: users can't switch a body *to* gRPC via the
// body-type tabs — gRPC bodies are materialised by Discover and edited via
// the dedicated gRPC request pane. The reducer's grpc case in `body.ts`
// reaches the tree directly without going through `requestBodyTypeChanged`.
export type RequestBodyTypeChangedPayload =
	| RequestBodyTypeToJsonPayload
	| RequestBodyTypeToJsonRawPayload
	| RequestBodyTypeToTextPayload
	| RequestBodyTypeToUrlEncodedFormPayload
	| RequestBodyTypeToFilePayload
	| RequestBodyTypeToMultipartPayload
	| RequestBodyTypeToGraphQlPayload;

interface RequestBodyTypeToJsonPayload extends RequestIdPayload {
	type: 'json';
	payload: EntryMap;
}

interface RequestBodyTypeToJsonRawPayload extends RequestIdPayload {
	type: 'json_raw';
	payload: string;
	/**
	 * EntryMap to persist on the json_raw body so Monaco's JSON validation
	 * can light up errors against the user's schema. Set when transitioning
	 * from a structured `json` body so the schema survives the switch.
	 */
	schemaSeed?: EntryMap;
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

interface RequestBodyTypeToMultipartPayload extends RequestIdPayload {
	type: 'multipart';
	payload: {
		boundary?: string;
		parts: import('@getbeak/types/request').MultipartPart[];
	};
}

interface RequestBodyTypeToGraphQlPayload extends RequestIdPayload {
	type: 'graphql';
	payload: {
		query: string;
		variables: EntryMap;
	};
}

export interface RequestBodyTextChangedPayload extends RequestIdPayload {
	text: string;
}

export interface RequestBodyJsonRawChangedPayload extends RequestIdPayload {
	text: string;
}

export interface RequestBodyFileChangedPayload extends RequestIdPayload {
	fileReferenceId: string | undefined;
	contentType: string | undefined;
}

export interface RequestBodyAssetRef {
	sha256: string;
	size: number;
	contentType?: string;
}

export interface RequestBodyAssetChangedPayload extends RequestIdPayload {
	/** `undefined` clears the asset; supplying a ref attaches it. */
	assetRef: RequestBodyAssetRef | undefined;
}

export interface RequestBodyMultipartChangedPayload extends RequestIdPayload {
	/** Full replacement of the multipart parts list. */
	parts: import('@getbeak/types/request').MultipartPart[];
	/** Optional explicit boundary; leave undefined to keep the existing one. */
	boundary?: string;
}

export interface RequestBodyJsonEditorNameChangePayload extends RequestIdPayload {
	id: string;
	name: string;
}

export interface RequestBodyJsonEditorValueChangePayload extends RequestIdPayload {
	id: string;
	value: ValueSections | boolean | null;
}

export interface RequestBodyJsonEditorTypeChangePayload extends RequestIdPayload {
	id: string;
	type: EntryType;
}

export interface RequestBodyJsonEditorEnabledChangePayload extends RequestIdPayload {
	id: string;
	enabled: boolean;
}

export interface RequestBodyJsonEditorDescriptionChangePayload extends RequestIdPayload {
	id: string;
	description: string | null;
}

export interface RequestBodyJsonEditorRequiredChangePayload extends RequestIdPayload {
	id: string;
	required: boolean | null;
}

export interface RequestBodyJsonEditorOptionsChangePayload extends RequestIdPayload {
	id: string;
	/**
	 * Typed enum options — `string | number | boolean | null`. The editor
	 * auto-detects each value's type from what the user types; the wire
	 * shape matches JSON Schema's `enum` keyword (which accepts any JSON
	 * primitive).
	 */
	options: import('@getbeak/types/body-editor-json').EnumOption[] | null;
}

export interface RequestBodyJsonEditorAddEntryPayload extends RequestIdPayload {
	id: string;
}
export interface RequestBodyJsonEditorRemoveEntryPayload extends RequestIdPayload {
	id: string;
}

export type JsonEntryMoveOp = 'before' | 'after' | 'inside';

/**
 * Move a JSON entry. `before` / `after` reorder relative to a sibling
 * `targetId`; `inside` reparents into the (object/array) target. Self-drops
 * and descendant-drops are rejected in the reducer.
 */
export interface RequestBodyJsonEditorMoveEntryPayload extends RequestIdPayload {
	id: string;
	targetId: string;
	op: JsonEntryMoveOp;
}

/**
 * Wholesale replacement of the JSON editor's payload — used by the schema
 * importer to drop a freshly-converted EntryMap onto the request. The
 * reducer overwrites without merging; if you need to preserve existing
 * entries, do the merge before dispatching.
 */
export interface RequestBodyJsonEditorReplacePayloadPayload extends RequestIdPayload {
	payload: EntryMap;
}

export interface RequestBodyUrlEncodedEditorNameChangePayload extends RequestIdPayload {
	id: string;
	name: string;
}

export interface RequestBodyUrlEncodedEditorValueChangePayload extends RequestIdPayload {
	id: string;
	value: ValueSections;
}

export interface RequestBodyUrlEncodedEditorEnabledChangePayload extends RequestIdPayload {
	id: string;
	enabled: boolean;
}

export interface RequestBodyUrlEncodedEditorAddItemPayload extends RequestIdPayload {}
export interface RequestBodyUrlEncodedEditorRemoveItemPayload extends RequestIdPayload {
	id: string;
}

export interface RequestBodyGraphQlEditorQueryChangedPayload extends RequestIdPayload {
	query: string;
}

export interface RequestBodyGrpcRequestJsonChangedPayload extends RequestIdPayload {
	requestJson: string;
}

export interface RequestBodyGrpcMetadataChangedPayload extends RequestIdPayload {
	metadata: Record<string, string>;
}
export interface RequestBodyGraphQlEditorReconcileVariablesPayload extends RequestIdPayload {
	variables: ExtractedVariables;
}

export interface RequestOptionFollowRedirects extends RequestIdPayload {
	followRedirects: boolean;
}

export interface RequestOptionDecompressResponse extends RequestIdPayload {
	decompressResponse: boolean;
}

export interface RequestOptionTimeoutMs extends RequestIdPayload {
	timeoutMs: number;
}

export interface RequestOptionMaxRedirects extends RequestIdPayload {
	maxRedirects: number;
}

export interface RequestOptionSendCookies extends RequestIdPayload {
	sendCookies: boolean;
}

export interface RequestOptionToggleAdditionalCookieJar extends RequestIdPayload {
	/** Variable-set name; toggled into / out of `additionalCookieJarSets`. */
	variableSet: string;
}

export interface SetPrimaryCookieJarPayload {
	/** Variable-set name to mark as the project's primary cookie jar. */
	variableSet: string;
}

export type Alert =
	| AlertMissingEncryption
	| AlertHttpBodyNotAllowed
	| AlertInvalidExtension
	| AlertEndpointSyncFailed
	| AlertFlightFailed;

/**
 * Severity sorts the surface treatment: `error` = blocking / data integrity,
 * `warning` = misconfig the user can fly past, `notice` = ambient gotchas
 * (linked-stale, untrusted spec, "first time setup" hints). Drives colour,
 * the status-strip counts, and whether a toast fires on insert.
 */
export type AlertSeverity = 'error' | 'warning' | 'notice';

/**
 * Where an alert lives. Used by the unified surfaces (sidebar row flair,
 * tab badge, inline banner) to decide which rows/tabs/panels light up.
 * `project` is the catch-all for anything that isn't tied to a single
 * request or endpoint folder.
 */
export type AlertScope =
	| { kind: 'project' }
	| { kind: 'request'; requestId: string }
	| { kind: 'endpoint'; folderPath: string };

/**
 * Predicate for batch removal. `kind` alone clears every alert in that
 * bucket; passing the identifier narrows to a single row/request.
 */
export type AlertScopeMatch =
	| { kind: 'project' }
	| { kind: 'request'; requestId?: string }
	| { kind: 'endpoint'; folderPath?: string };

export interface AlertBase {
	type: string;
	severity: AlertSeverity;
	scope: AlertScope;
}

export interface AlertMissingEncryption extends AlertBase {
	type: 'missing_encryption';
	severity: 'error';
	scope: { kind: 'project' };
}

export interface AlertHttpBodyNotAllowed extends AlertBase {
	type: 'http_body_not_allowed';
	severity: 'warning';
	scope: { kind: 'request'; requestId: string };
}

export interface AlertInvalidExtension extends AlertBase {
	type: 'invalid_extension';
	severity: 'error';
	scope: { kind: 'project' };
	payload: {
		error: Squawk;
		assumedName: string;
		filePath: string;
	};
}

/**
 * Last sync attempt against an endpoint collection (graphql / openapi /
 * grpc) failed. Surfaced through every alert channel: bottom status strip,
 * the matching Endpoints sidebar row (via scope.folderPath), and the
 * Problems panel. Dispatching the same `ident` overwrites the previous
 * failure; a successful resync should drop the alert via
 * `alertRemove(ident)`.
 */
/**
 * Last flight against this request failed (network error, parse error,
 * pre-flight check, etc.). Cleared automatically the next time a flight
 * for the same request starts or completes successfully. The full error
 * still renders inside the response pane — the alert exists so the
 * sidebar / tab / strip light up too.
 */
export interface AlertFlightFailed extends AlertBase {
	type: 'flight_failed';
	severity: 'error';
	scope: { kind: 'request'; requestId: string };
	payload: {
		/** Short, single-line summary suitable for the toast + strip. */
		errorMessage: string;
		/** flightId that failed; lets the alert ident be stable across runs. */
		flightId: string;
	};
}

/** Compose a stable alert ident for a flight failure on a given request. */
export function flightFailedIdent(requestId: string): string {
	return `alert:flight-failed:${requestId}`;
}

export interface AlertEndpointSyncFailed extends AlertBase {
	type: 'endpoint_sync_failed';
	severity: 'warning';
	scope: { kind: 'endpoint'; folderPath: string };
	payload: {
		/** Display name for the row (folder basename when we know nothing more specific). */
		folderName: string;
		/** Whether this is openapi / graphql / grpc — drives the icon shown in the alert. */
		kind: 'openapi' | 'graphql' | 'grpc';
		/** Single-line failure message, surfaced verbatim. */
		errorMessage: string;
	};
}

/** Compose a stable alert ident for an endpoint sync failure. */
export function endpointSyncFailedIdent(folderPath: string): string {
	return `alert:endpoint-sync-failed:${folderPath}`;
}

export interface AlertInsertPayload {
	ident: string;
	alert: Alert;
}

export default {
	ActionTypes,
	initialState,
};
