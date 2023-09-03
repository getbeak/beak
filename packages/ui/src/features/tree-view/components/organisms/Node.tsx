import React, { MutableRefObject } from 'react';
import styled from 'styled-components';

import { TreeViewNode } from '../../types';
import NodeItem from '../molecules/NodeItem';
import NodeName from '../molecules/NodeName';

interface NodeProps {
	depth: number;
	node: TreeViewNode;
	hierarchicalParentRef?: MutableRefObject<HTMLElement | null>;
}

const Node: React.FC<React.PropsWithChildren<NodeProps>> = props => {
	const { depth, node } = props;

	return (
		<NodeWrapper>
			<NodeItem node={node} depth={depth}>
				<NodeName node={node} collapsed={false} />
			</NodeItem>
		</NodeWrapper>
	);
};

const NodeWrapper = styled.div``;

export default Node;
