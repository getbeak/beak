import { RequestNode } from '@beak/common/src/beak-project/types';
import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import Header from './molecules/Header';
import PendingSlash from './molecules/PendingSplash';
import InspectorTabs from './organisms/InspectorTabs';

const ResponsePane: React.FunctionComponent = () => {
	const flight = useSelector(s => s.global.flight);
	const { tree, selectedRequest } = useSelector(s => s.global.project);
	const [selectedFlightIndex, setSelectedFlightIndex] = useState(0);
	const selectedNode = tree![selectedRequest || 'non_existent'];

	if (!selectedRequest)
		return <PendingSlash />;

	if (selectedRequest && !selectedNode)
		throw new Error('fucked state?!');

	const typedSelectedNode = selectedNode as RequestNode;
	const flightHistory = flight.flightHistory[typedSelectedNode.id];

	if (!flightHistory)
		return <PendingSlash />;

	const selectedFlightHistory = flightHistory[selectedFlightIndex];

	return (
		<Container>
			<Header
				flightHistory={flightHistory}
				selectedFlightIndex={selectedFlightIndex}
				updateSelectedFlight={setSelectedFlightIndex}
			/>
			<InspectorTabs flight={selectedFlightHistory} />
		</Container>
	);
};

const Container = styled.div`
	display: flex;
	flex-direction: column;
	background-color: ${props => props.theme.ui.surface};
	height: 100%;
	width: 100%;
`;

export default ResponsePane;
