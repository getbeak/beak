export type TreeViewNode = TreeViewFolder | TreeViewItem;

export interface TreeViewItems {
	[k: string]: TreeViewNode;
}

export interface TreeViewFolder {
	id: string;
	type: 'folder';
	filePath: string;
	name: string;
	parent: string | 'root' | null;
}

export interface TreeViewItem {
	id: string;
	type: 'request';
	filePath: string;
	name: string;
	parent: string | 'root' | null;
}
