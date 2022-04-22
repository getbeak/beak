import React from 'react';
import { useSelector } from 'react-redux';
import PendingSlash from '@beak/app/components/molecules/PendingSplash';
import styled from 'styled-components';

import Header from './molecules/Header';
import Inspector from './organisms/Inspector';

const ResponsePane: React.FunctionComponent<React.PropsWithChildren<unknown>> = () => {
	const { tree } = useSelector(s => s.global.project);
	const selectedTab = useSelector(s => s.features.tabs.selectedTab);
	const flightHistories = useSelector(s => s.global.flight.flightHistory);
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
