export interface ProjectFile {
	name: string;
	version: string;
}

export interface RequestNodeFile extends RequestInfo {
	id: string;
	name: string;
}

export interface Node {
	type: 'folder' | 'request';
	filePath: string;
	parent: Node | null;
}

export interface FolderNode extends Node {
	type: 'folder';
	children: Nodes[];
	name: string;
}

export interface RequestNode extends Node {
	id: string;
	type: 'request';
	name: string;

	info: RequestInfo;
}

export interface RequestInfo {
	uri: {
		protocol: string;
		verb: string;
		hostname: string | null;
		path: string | null;
		query: {
			name: string;
			value: string;
			enabled: boolean;
		}[];
		fragment: string | null;
	};
	headers: {
		name: string;
		value: string;
		enabled: boolean;
	}[];
}

export type Nodes = FolderNode | RequestNode;
