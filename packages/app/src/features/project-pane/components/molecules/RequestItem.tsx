import { RequestNode } from '@beak/common/types/beak-project';
import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';

import { requestSelected } from '../../../../store/project/actions';
import RequestStatusBlob from '../atoms/RequestStatusBlob';

export interface RequestItemProps {
	depth: number;
	id: string;
}

const RequestItem: React.FunctionComponent<RequestItemProps> = props => {
	const dispatch = useDispatch();
	const node = useSelector(s => s.global.project.tree![props.id]) as RequestNode;
	const selectedRequest = useSelector(s => s.global.project.selectedRequest);
	const flight = useSelector(s => s.global.flight.flightHistory[node.id]);

	return (
		<Wrapper
			active={selectedRequest === props.id}
			data-tree-id={node.id}
			depth={props.depth}
			onClick={() => dispatch(requestSelected(props.id))}
		>
			<Name title={node.name}>
				{node.name}
			</Name>

			{flight?.[0]!.response && <RequestStatusBlob $status={flight[0].response.status} />}
		</Wrapper>
	);
};

interface WrapperProps {
	active: boolean;
	depth: number;
}

const Wrapper = styled.div<WrapperProps>`
	display: flex;
	padding: 4px 0;
	padding-left: ${props => (props.depth * 8) + 19}px;
	cursor: pointer;
	font-size: 13px;
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

export default RequestItem;
