import { TypedObject } from '@beak/common/helpers/typescript';
import { useAppSelector } from '@beak/ui/store/redux';
import { useMemo } from 'react';

import type { TreeViewFolderNode, TreeViewItem, TreeViewNodes } from '../types';

export interface FlatNode {
	id: string;
	depth: number;
	isFolder: boolean;
	node: TreeViewItem;
}

interface FlattenedTree {
	flat: FlatNode[];
	indexById: Record<string, number>;
}

function sortByName(a: TreeViewItem, b: TreeViewItem) {
	return a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' });
}

export default function useFlattenedTree(
	tree: TreeViewNodes,
	rootParentName: string,
): FlattenedTree {
	const collapsedMap = useAppSelector(s => s.global.preferences.projectPane.collapsed);

	return useMemo(() => {
		const flat: FlatNode[] = [];

		const walk = (parentPath: string, depth: number) => {
			const children = TypedObject.values(tree)
				.filter(t => t.parent === parentPath)
				.sort(sortByName);

			const folders = children.filter(c => c.type === 'folder') as TreeViewFolderNode[];
			const others = children.filter(c => c.type !== 'folder');

			for (const folder of folders) {
				flat.push({ id: folder.id, depth, isFolder: true, node: folder });
				if (!collapsedMap[folder.id]) walk(folder.filePath, depth + 1);
			}
			for (const node of others) {
				flat.push({ id: node.id, depth, isFolder: false, node });
			}
		};

		walk(rootParentName, 0);

		const indexById: Record<string, number> = {};
		for (let i = 0; i < flat.length; i++) indexById[flat[i].id] = i;

		return { flat, indexById };
	}, [tree, rootParentName, collapsedMap]);
}
