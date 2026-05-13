import { Box } from '@chakra-ui/react';
import { useAppSelector } from '@beak/ui/store/redux';
import * as React from 'react';

import { useNodeDrop } from '../../hooks/drag-and-drop';
import type { TreeViewFolderNode } from '../../types';
import NodeItem from '../molecules/NodeItem';
import NodeName from '../molecules/NodeName';

interface FolderNodeProps {
	depth: number;
	node: TreeViewFolderNode;
}

const FolderNode: React.FC<FolderNodeProps> = ({ depth, node }) => {
	const collapsed = useAppSelector(s => s.global.preferences.projectPane.collapsed[node.id]);
	const [{ hovering, canDrop }, dropRef] = useNodeDrop(node);
	const highlight = canDrop && hovering;

	return (
		<Box
			ref={dropRef as unknown as React.Ref<HTMLDivElement>}
			borderRadius={highlight ? 'sm' : undefined}
			bg={
				highlight
					? 'color-mix(in srgb, var(--beak-colors-accent-pink) 28%, transparent)'
					: undefined
			}
			transition='background-color .12s ease'
		>
			<NodeItem node={node} collapsed={collapsed} collapsible depth={depth}>
				<NodeName node={node} collapsed={collapsed} collapsible />
			</NodeItem>
		</Box>
	);
};

export default FolderNode;
