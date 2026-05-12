import { TypedObject } from '@beak/common/helpers/typescript';
import { useContext } from 'react';

import { TreeViewNodesContext } from '../contexts/nodes-context';
import type { TreeViewFolderNode, TreeViewNode } from '../types';

interface ReturnType {
	nodes: TreeViewNode[];
	folderNodes: TreeViewFolderNode[];
}

export default function useChildNodes(filePath: string): ReturnType {
	const context = useContext(TreeViewNodesContext);

	if (!context) return { nodes: [], folderNodes: [] };

	const childNodes = TypedObject.values(context)
		.filter(i => i.parent === filePath)
		.sort((a, b) =>
			a.name.localeCompare(b.name, void 0, {
				numeric: true,
				sensitivity: 'base',
			}),
		);

	return {
		nodes: childNodes.filter(n => n.type !== 'folder') as TreeViewNode[],
		folderNodes: childNodes.filter(n => n.type === 'folder') as TreeViewFolderNode[],
	};
}
