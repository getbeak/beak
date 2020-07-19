export interface ProjectFile {
	name: string;
	version: string;
}

export interface RequestNodeFile {
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
}

export type Nodes = FolderNode | RequestNode;
