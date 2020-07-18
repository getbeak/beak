import React from 'react';
import styled from 'styled-components';

import { RequestNode } from '../../../../lib/project/types';

export interface RequestItemProps {
	depth: number;
	node: RequestNode;
}

const RequestItem: React.FunctionComponent<RequestItemProps> = props => (
	<Wrapper depth={props.depth}>
		{props.node.name}
	</Wrapper>
);

const Wrapper = styled.div<{ depth: number }>`
	padding: 2px 0;
	padding-left: ${props => (props.depth * 8) + 14}px;
	cursor: pointer;
	font-size: 12px;
	color: ${props => props.theme.ui.textOnSurfaceBackground};

	&:hover {
		background-color: ${props => props.theme.ui.background};
	}
`;

export default RequestItem;
