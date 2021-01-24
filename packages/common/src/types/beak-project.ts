export interface ProjectFile {
	name: string;
	version: string;
}

export interface RequestNodeFile extends RequestOverview {
	id: string;
}

export interface Node {
	id: string;
	type: 'folder' | 'request';
	name: string;
	filePath: string;
	parent: string | null;
}

export interface FolderNode extends Node {
	type: 'folder';
}

export interface RequestNode extends Node {
	type: 'request';
	info: RequestOverview;
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
}

export type RequestBodyType = 'text' | 'json' | 'url-encoded-form';
export type RequestBody = RequestBodyText | RequestBodyJson | RequestBodyUrlEncodedForm;

export interface RequestBodyText {
	type: 'text';
	payload: string;
}

export interface RequestBodyJson {
	type: 'json';
	payload: string;
}

export interface RequestBodyUrlEncodedForm {
	type: 'url-encoded-form';
	payload: Record<string, ToggleKeyValue>;
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
	values: Record<string, VariableGroupValue>;
}

export interface VariableGroupValue {
	groupId: string;
	itemId: string;
	value: string;
}

export type ValueParts = (string | RealtimeValue)[];

export type RealtimeValue = VariableGroupItem;

export interface VariableGroupItem {
	type: 'variable_group_item';
	payload: {
		itemId: string;
	};
}

export type Nodes = FolderNode | RequestNode;
export type Tree = Record<string, Nodes>;
export type VariableGroups = Record<string, VariableGroup>;
