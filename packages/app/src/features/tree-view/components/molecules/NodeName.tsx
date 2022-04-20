import React from 'react';
import styled from 'styled-components';

import Chevron from '../atoms/Chevron';

interface NodeNameProps {
	collapsed?: boolean;
	collapsible?: boolean;
	name: string;
}

const NodeName: React.FunctionComponent<NodeNameProps> = props => {
	const { collapsed, collapsible, name } = props;

	return (
		<React.Fragment>
			<Chevron $collapsible={Boolean(collapsible)} $collapsed={Boolean(collapsed)} />
			{/* <Renamer node={node} parentRef={element}>
				{node.name}
			</Renamer> */}
			<Renamer>
				{name}
			</Renamer>
		</React.Fragment>
	);
};

const Renamer = styled.div``;

export default NodeName;
