import { Box } from '@chakra-ui/react';
import * as React from 'react';
import type { MutableRefObject } from 'react';

import type { TreeViewNode } from '../../types';
import NodeItem from '../molecules/NodeItem';
import NodeName from '../molecules/NodeName';

interface NodeProps {
	depth: number;
	node: TreeViewNode;
	hierarchicalParentRef?: MutableRefObject<HTMLElement | null>;
}

const Node: React.FC<NodeProps> = ({ depth, node }) => (
	<Box>
		<NodeItem node={node} depth={depth}>
			<NodeName node={node} collapsed={false} />
		</NodeItem>
	</Box>
);

export default Node;
