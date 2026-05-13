import { Box } from '@chakra-ui/react';
import { useAppSelector } from '@beak/ui/store/redux';
import * as React from 'react';
import type { MutableRefObject } from 'react';

import { useNodeDrop } from '../../hooks/drag-and-drop';
import useChildNodes from '../../hooks/use-child-nodes';
import type { TreeViewFolderNode } from '../../types';
import NodeItem from '../molecules/NodeItem';
import NodeName from '../molecules/NodeName';
import Node from './Node';

interface FolderNodeProps {
	depth: number;
	node: TreeViewFolderNode;
	hierarchicalParentRef?: MutableRefObject<HTMLElement | null>;
}

const FolderNode: React.FC<FolderNodeProps> = ({ depth, node }) => {
	const collapsed = useAppSelector(s => s.global.preferences.projectPane.collapsed[node.id]);
	const { folderNodes, nodes } = useChildNodes(node.filePath);
	const [{ hovering, canDrop }, dropRef] = useNodeDrop(node);
	const highlight = canDrop && hovering;

	return (
		<Box
			ref={dropRef as unknown as React.Ref<HTMLDivElement>}
			borderRadius={highlight ? 'sm' : undefined}
			bg={highlight ? 'color-mix(in srgb, var(--beak-colors-accent-pink) 60%, transparent)' : undefined}
		>
			<NodeItem node={node} collapsed={collapsed} collapsible depth={depth}>
				<NodeName node={node} collapsed={collapsed} collapsible />
			</NodeItem>
			<Box>
				{!collapsed && folderNodes.map(n => <FolderNode key={n.id} depth={depth + 1} node={n} />)}
				{!collapsed && nodes.map(n => <Node key={n.id} depth={depth + 1} node={n} />)}
			</Box>
		</Box>
	);
};

export default FolderNode;
