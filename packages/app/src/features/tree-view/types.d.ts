export type TreeViewItem = TreeViewFolderNode | TreeViewNode;

export interface TreeViewNodes {
	[k: string]: TreeViewItem;
}

export interface TreeViewFolderNode {
	id: string;
	type: 'folder';
	filePath: string;
	name: string;
	parent: string | 'root' | null;
}

export interface TreeViewNode {
	id: string;
	type: string;
	filePath: string;
	name: string;
	parent: string | 'root' | null;
}

export interface ActiveRename {
	id: string;
	name: string;
}
