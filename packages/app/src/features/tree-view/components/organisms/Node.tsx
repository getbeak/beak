import React, { MutableRefObject } from 'react';
import styled from 'styled-components';

import { TreeViewItem } from '../../types';
import NodeItem from '../molecules/NodeItem';
import NodeName from '../molecules/NodeName';

interface NodeProps {
	depth: number;
	item: TreeViewItem;
	parentElement?: MutableRefObject<HTMLElement | null>;
}

const Node: React.FunctionComponent<NodeProps> = props => {
	const { depth, item } = props;

	return (
		<NodeWrapper>
			<NodeItem id={item.id} depth={depth}>
				<NodeName collapsed={false} name={item.name} />
			</NodeItem>
		</NodeWrapper>
	);
};

const NodeWrapper = styled.div``;

export default Node;
