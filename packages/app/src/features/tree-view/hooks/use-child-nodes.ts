import { useContext } from 'react';
import { TypedObject } from '@beak/common/helpers/typescript';

import { TreeViewItemsContext } from '../contexts/items-context';
import { TreeViewFolder, TreeViewItem } from '../types';

interface ReturnType {
	nodes: TreeViewItem[];
	folderNodes: TreeViewFolder[];
}

export default function useChildNodes(filePath: string): ReturnType {
	const context = useContext(TreeViewItemsContext);

	if (!context) return { nodes: [], folderNodes: [] };

	const childNodes = TypedObject.values(context)
		.filter(i => i.parent === filePath)
		.sort((a, b) => a.name.localeCompare(b.name, void 0, {
			numeric: true,
			sensitivity: 'base',
		}));

	return {
		nodes: childNodes.filter(n => n.type !== 'folder') as TreeViewItem[],
		folderNodes: childNodes.filter(n => n.type === 'folder') as TreeViewFolder[],
	};
}
