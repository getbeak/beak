import { Flex } from '@chakra-ui/react';
import { selectActiveFlight } from '@beak/state/flight';
import PendingSlash from '@beak/ui/components/molecules/PendingSplash';
import { useAppSelector } from '@beak/ui/store/redux';
import * as React from 'react';

import FlightInProgress from './molecules/FlightInProgress';
import Header from './molecules/Header';
import Inspector from './organisms/Inspector';

const ResponsePane: React.FC = () => {
	const { tree } = useAppSelector(s => s.global.project);
	const selectedTab = useAppSelector(s => s.features.tabs.selectedTab);
	const flightHistories = useAppSelector(s => s.global.flight.flightHistories);
	const currentFlight = useAppSelector(s => (selectedTab ? selectActiveFlight(selectedTab)(s) : null)) ?? undefined;
	const selectedNode = tree![selectedTab!];
	const flightHistory = flightHistories[selectedTab!];
	const selectedFlight = flightHistory?.selected !== undefined
		? flightHistory.history[flightHistory.selected]
		: undefined;
	const pending = !selectedNode || !flightHistory || !selectedFlight;

	return (
		<Flex
			position='relative'
			direction='column'
			bg='bg.surface'
			h='100%'
			w='100%'
			css={{
				'&::before': {
					content: '""',
					position: 'absolute',
					top: '8%',
					bottom: '8%',
					left: 0,
					width: '1px',
					background: 'linear-gradient(to bottom, transparent, color-mix(in srgb, var(--beak-colors-border-default) 65%, transparent) 8%, color-mix(in srgb, var(--beak-colors-border-default) 65%, transparent) 92%, transparent)',
					pointerEvents: 'none',
					zIndex: 1,
				},
			}}
		>
			{pending && <PendingSlash />}
			{!pending && (
				<React.Fragment>
					<Header selectedFlight={selectedFlight} />
					<Inspector flight={selectedFlight} />
				</React.Fragment>
			)}

			<FlightInProgress requestId={selectedTab!} currentFlight={currentFlight} />
		</Flex>
	);
};

export default ResponsePane;
