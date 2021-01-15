import React from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import Header from './molecules/Header';
import PendingSlash from './molecules/PendingSplash';
import Inspector from './organisms/Inspector';

const ResponsePane: React.FunctionComponent = () => {
	const { tree, selectedTabPayload } = useSelector(s => s.global.project);
	const flightHistories = useSelector(s => s.global.flight.flightHistory);
	const selectedNode = tree![selectedTabPayload || 'non_existent'];

	if (!selectedTabPayload) {
		return (
			<Container>
				<PendingSlash />
			</Container>
		);
	}

	if (selectedTabPayload && !selectedNode) {
		return (
			<Container>
				<span>{'id does not exist'}</span>
			</Container>
		);
	}

	const flightHistory = flightHistories[selectedTabPayload];

	if (!flightHistory) {
		return (
			<Container>
				<PendingSlash />
			</Container>
		);
	}

	const selectedFlight = flightHistory.history[flightHistory.selected!];

	if (!selectedFlight) {
		return (
			<Container>
				<span>{'selected flight id does not exist'}</span>
			</Container>
		);
	}

	return (
		<Container>
			<Header selectedFlight={selectedFlight} />
			<Inspector flight={selectedFlight} />
		</Container>
	);
};

const Container = styled.div`
	display: flex;
	flex-direction: column;
	background-color: ${props => props.theme.ui.surface};
	height: calc(100% - 39px);
	width: 100%;
`;

export default ResponsePane;
