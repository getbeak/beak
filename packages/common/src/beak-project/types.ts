export interface ProjectFile {
	name: string;
	version: string;
}

export interface RequestNodeFile extends RequestOverview {
	id: string;
	name: string;
}

export interface Node {
	type: 'folder' | 'request';
	filePath: string;
	parent: string | null;
}

export interface FolderNode extends Node {
	type: 'folder';
	children: string[];
	name: string;
}

export interface RequestNode extends Node {
	id: string;
	type: 'request';
	name: string;

	info: RequestOverview;
}

export interface ToggleKeyValue {
	name: string;
	value: string;
	enabled: boolean;
}

export interface RequestOverview {
	verb: string;
	uri: {
		protocol: string;
		hostname: string | null;
		path: string | null;
		query: Record<string, ToggleKeyValue>;
		fragment: string | null;
	};
	headers: Record<string, ToggleKeyValue>;
}

export interface ResponseOverview {
	headers: Record<string, string>;
	redirected: boolean;
	status: number;
	url: string;
}

export type Nodes = FolderNode | RequestNode;

export type Tree = Record<string, Nodes>;
