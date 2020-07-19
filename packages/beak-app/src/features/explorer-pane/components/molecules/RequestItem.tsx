import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';

import { RequestNode } from '../../../../lib/project/types';
import { requestSelected } from '../../../../store/project/actions';
import RequestStatusBlob from '../atoms/RequestStatusBlob';

export interface RequestItemProps {
	depth: number;
	node: RequestNode;
}

const RequestItem: React.FunctionComponent<RequestItemProps> = props => {
	const dispatch = useDispatch();
	const selectedRequest = useSelector(s => s.global.project.selectedRequest);

	return (
		<Wrapper
			active={selectedRequest === props.node.id}
			depth={props.depth}
			onClick={() => dispatch(requestSelected(props.node.id))}
		>
			<Name title={props.node.name}>
				{props.node.name}
			</Name>

			<RequestStatusBlob status={generateMockStatus()} />
		</Wrapper>
	);
};

interface WrapperProps {
	active: boolean;
	depth: number;
}

const Wrapper = styled.div<WrapperProps>`
	display: flex;
	padding: 2px 0;
	padding-left: ${props => (props.depth * 8) + 19}px;
	cursor: pointer;
	font-size: 12px;
	line-height: 18px;

	color: ${props => props.theme.ui.textMinor};

	&:hover {
		color: ${props => props.theme.ui.textOnSurfaceBackground};
	}

	background-color: ${props => props.active ? props.theme.ui.background : 'transparent'};
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
