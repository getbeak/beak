import React from 'react';
import PendingSlash from '@beak/app/components/molecules/PendingSplash';
import { useAppSelector } from '@beak/app/store/redux';
import styled from 'styled-components';

import FlightInProgress from './molecules/FlightInProgress';
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
	const pending = !selectedNode || !flightHistory || !selectedFlight;

	return (
		<Container>
			{pending && <PendingSlash />}
			{!pending && (
				<React.Fragment>
					<Header selectedFlight={selectedFlight} />
					<Inspector flight={selectedFlight} />
				</React.Fragment>
			)}

			<FlightInProgress requestId={selectedTab!} currentFlight={currentFlight} />
		</Container>
	);
};

const Container = styled.div`
	position: relative;
	display: flex;
	flex-direction: column;
	background-color: ${props => props.theme.ui.surface};
	height: 100%;
	width: 100%;
`;

export default ResponsePane;
