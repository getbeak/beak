import React from 'react';

import { TreeViewItem } from '../../types';
import Chevron from '../atoms/Chevron';
import NodeRenamer from './NodeRenamer';

interface NodeNameProps {
	node: TreeViewItem;
	collapsed?: boolean;
	collapsible?: boolean;
}

const NodeName: React.FunctionComponent<NodeNameProps> = props => {
	const { collapsed, collapsible, node } = props;

	return (
		<React.Fragment>
			<Chevron $collapsible={Boolean(collapsible)} $collapsed={Boolean(collapsed)} />
			<NodeRenamer node={node} />
		</React.Fragment>
	);
};

export default NodeName;
