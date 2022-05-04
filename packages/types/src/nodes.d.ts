import { RequestOverview } from './request';
import { Squawk } from './squawk';

export type Nodes = FolderNode | RequestNode;
export type NodeType = 'folder' | 'request';
export type Tree = Record<string, Nodes>;
export type RequestNode = ValidRequestNode | FailedRequestNode;

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

export interface RequestNodeFile extends RequestOverview {
	id: string;
}
