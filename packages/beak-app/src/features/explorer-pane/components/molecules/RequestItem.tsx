import React from 'react';
import styled from 'styled-components';

import { RequestNode } from '../../../../lib/project/types';
import RequestStatusBlob from '../atoms/RequestStatusBlob';

export interface RequestItemProps {
	depth: number;
	node: RequestNode;
}

const RequestItem: React.FunctionComponent<RequestItemProps> = props => (
	<Wrapper depth={props.depth}>
		<Name title={props.node.name}>
			{props.node.name}
		</Name>

		<RequestStatusBlob status={generateMockStatus()} />
	</Wrapper>
);

const Wrapper = styled.div<{ depth: number }>`
	display: flex;
	padding: 2px 0;
	padding-left: ${props => (props.depth * 8) + 19}px;
	cursor: pointer;
	font-size: 12px;
	color: ${props => props.theme.ui.textOnSurfaceBackground};

	&:hover {
		background-color: ${props => props.theme.ui.background};
	}
`;

const Name = styled.abbr`
	flex-grow: 2;
	
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
	text-decoration: none;
`;

function generateMockStatus() {
	const ran = Math.floor(Math.random() * 3) + 1;

	if (ran === 1)
		return 'success';
	else if (ran === 2)
		return 'warning';

	return 'failure';
}

export default RequestItem;
