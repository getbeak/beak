import React from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import { RequestNode } from '../../../lib/project/types';
import { constructUri } from '../../../lib/project/url';
import InspectorTabs from './organisms/InspectorTabs';

const InspectorPane: React.FunctionComponent = () => {
	const flight = useSelector(s => s.global.flight);
	const { tree, selectedRequest } = useSelector(s => s.global.project);
	const selectedNode = tree![selectedRequest || 'non_existent'];

	// TODO(afr): Maybe some sort of purgatory state here
	if (!selectedRequest)
		return <Container />;

	if (selectedRequest && !selectedNode)
		throw new Error('fucked state?!');

	const typedSelectedNode = selectedNode as RequestNode;
	const flightHistory = flight.flightHistory[typedSelectedNode.id]?.[0];

	// TODO(afr): Maybe some sort of purgatory state here
	if (!flightHistory)
		return <Container />;

	return (
		<Container>
			<TempUrlPane>
				{constructUri(flightHistory.info)}
			</TempUrlPane>
			<InspectorTabs flight={flightHistory!} />
		</Container>
	);
};

const Container = styled.div`
	display: flex;
	flex-direction: column;
	background-color: ${props => props.theme.ui.secondaryBackground};
	height: 100%;
	width: 100%;
`;

const TempUrlPane = styled.div`
	padding: 25px;

	text-align: center;
`;

export default InspectorPane;
