import { RequestNode } from '@beak/common/types/beak-project';
import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import FlightHistorySelector from './molecules/FlightHistorySelector';
import Header from './molecules/Header';
import PendingSlash from './molecules/PendingSplash';
import Inspector from './organisms/Inspector';

const ResponsePane: React.FunctionComponent = () => {
	const flight = useSelector(s => s.global.flight);
	const { tree, selectedRequest } = useSelector(s => s.global.project);
	const [selectedFlightIndex, setSelectedFlightIndex] = useState(0);
	const selectedNode = tree![selectedRequest || 'non_existent'];

	if (!selectedRequest) {
		return (
			<Container>
				<PendingSlash />
			</Container>
		);
	}

	if (selectedRequest && !selectedNode) {
		return (
			<Container>
				<span>{'id does not exist'}</span>
			</Container>
		);
	}

	const typedSelectedNode = selectedNode as RequestNode;
	const flightHistory = flight.flightHistory[typedSelectedNode.id];

	if (!flightHistory) {
		return (
			<Container>
				<PendingSlash />
			</Container>
		);
	}

	const selectedFlightHistory = flightHistory[selectedFlightIndex];

	return (
		<Container>
			<Header
				flightHistory={flightHistory}
				selectedFlightIndex={selectedFlightIndex}
			/>
			{/* Being this back when it's moved into the header */}
			{/* <FlightHistorySelector
				flightHistory={flightHistory}
				selectedFlightIndex={selectedFlightIndex}
				updateSelectedFlight={setSelectedFlightIndex}
			/> */}
			<Inspector flight={selectedFlightHistory} />
		</Container>
	);
};

const Container = styled.div`
	display: flex;
	flex-direction: column;
	background-color: ${props => props.theme.ui.surface};
	height: calc(100% - 40px);
	width: 100%;
`;

export default ResponsePane;
