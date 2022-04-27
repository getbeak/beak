import Squawk from '../utils/squawk';
import { EntryMap } from './beak-json-editor';
import { RealtimeValuePart } from './realtime-values';

export interface ProjectFile {
	id: string;
	name: string;
	version: string;
}

export interface ProjectEncryption {
	algorithm: 'aes-256-ctr';
	key: string;
}

export interface RequestNodeFile extends RequestOverview {
	id: string;
}

export type NodeType = 'folder' | 'request';

export interface Node {
	id: string;
	type: NodeType;
	name: string;
	filePath: string;
	parent: string | null;
}

export interface FolderNode extends Node {
	type: 'folder';
}

export type RequestNode = ValidRequestNode | FailedRequestNode;

export interface ValidRequestNode extends Node {
	type: 'request';
	mode: 'valid';
	info: RequestOverview;
}

export interface FailedRequestNode extends Node {
	type: 'request';
	mode: 'failed';
	error: Squawk;
}

export interface ToggleKeyValue {
	name: string;
	value: ValueParts;
	enabled: boolean;
}

export interface RequestOverview {
	verb: string;
	url: ValueParts;
	query: Record<string, ToggleKeyValue>;
	headers: Record<string, ToggleKeyValue>;
	body: RequestBody;
	options: RequestOptions;
}

export type RequestBodyType = 'text' | 'json' | 'url_encoded_form';
export type RequestBody = RequestBodyText | RequestBodyJson | RequestBodyUrlEncodedForm;

export interface RequestBodyText {
	type: 'text';
	payload: string;
}

export interface RequestBodyJson {
	type: 'json';
	payload: EntryMap;
}

export interface RequestBodyUrlEncodedForm {
	type: 'url_encoded_form';
	payload: Record<string, ToggleKeyValue>;
}

export interface RequestOptions {
	followRedirects: boolean;
}

export interface ResponseOverview {
	headers: Record<string, string>;
	redirected: boolean;
	status: number;
	url: string;
	hasBody: boolean;
}

export interface VariableGroup {
	groups: Record<string, string>;
	items: Record<string, string>;
	values: Record<string, ValueParts>;
}

export type ValuePart = string | RealtimeValuePart;
export type ValueParts = ValuePart[];
export type Nodes = FolderNode | RequestNode;
export type Tree = Record<string, Nodes>;
export type VariableGroups = Record<string, VariableGroup>;

// NOTE(afr): Adding a new tab item? Don't forget to update tab-preferences schema too!
export type TabItem = RequestTabItem | VariableGroupEditorTabItem;

export interface TabBase {
	type: string;
	payload: unknown;
	temporary: boolean;
}

export interface RequestTabItem extends TabBase {
	type: 'request';
	payload: string;
}

export interface VariableGroupEditorTabItem extends TabBase {
	type: 'variable_group_editor';
	payload: string;
}
