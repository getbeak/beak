import React from 'react';
import PendingSlash from '@beak/app-beak/components/molecules/PendingSplash';
import { useAppSelector } from '@beak/app-beak/store/redux';
import styled from 'styled-components';

import Header from './molecules/Header';
import Inspector from './organisms/Inspector';

const ResponsePane: React.FC<React.PropsWithChildren<unknown>> = () => {
	const { tree } = useAppSelector(s => s.global.project);
	const selectedTab = useAppSelector(s => s.features.tabs.selectedTab);
	const flightHistories = useAppSelector(s => s.global.flight.flightHistory);
	const selectedNode = tree![selectedTab || 'non_existent'];

	if (!selectedTab) {
		return (
			<Container>
				<PendingSlash />
			</Container>
		);
	}

	if (selectedTab && !selectedNode) {
		return (
			<Container>
				<span>{'id does not exist'}</span>
			</Container>
		);
	}

	const flightHistory = flightHistories[selectedTab];

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
	height: 100%;
	width: 100%;
`;

export default ResponsePane;
