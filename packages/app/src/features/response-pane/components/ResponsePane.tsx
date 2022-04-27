import React, { useEffect } from 'react';
import PendingSlash from '@beak/app/components/molecules/PendingSplash';
import { useAppSelector } from '@beak/app/store/redux';
import styled from 'styled-components';

import Header from './molecules/Header';
import Inspector from './organisms/Inspector';

const ResponsePane: React.FC<React.PropsWithChildren<unknown>> = () => {
	const { tree } = useAppSelector(s => s.global.project);
	const selectedTab = useAppSelector(s => s.features.tabs.selectedTab);
	const flightHistories = useAppSelector(s => s.global.flight.flightHistory);
	const currentFlight = useAppSelector(s => s.global.flight.currentFlight);
	const selectedNode = tree![selectedTab!];
	const flightHistory = flightHistories[selectedTab!];
	const selectedFlight = flightHistory?.history[flightHistory?.selected!];

	if (!selectedNode) {
		return (
			<Container>
				<PendingSlash />
			</Container>
		);
	}

	if (currentFlight && currentFlight.requestId === selectedNode.id) {
		return (
			<Container>
				{'doing!'}
			</Container>
		);
	}

	if (!flightHistory) {
		return (
			<Container>
				<PendingSlash />
			</Container>
		);
	}

	if (!selectedFlight) {
		return (
			<Container>
				<PendingSlash />
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
	height: 100%;
	width: 100%;
`;

export default ResponsePane;
