import { Box } from '@chakra-ui/react';
import { useAppSelector } from '@beak/ui/store/redux';
import * as React from 'react';

const ProgressIndicator: React.FC = () => {
	const selectedTab = useAppSelector(s => s.features.tabs.selectedTab);
	const activeFlight = useAppSelector(s => (selectedTab ? s.global.flight.activeFlights[selectedTab] : undefined));

	const percentage = activeFlight?.bodyTransferPercentage ?? 0;

	return (
		<Box position='relative' h='4px'>
			{activeFlight && (
				<Box
					position='absolute'
					top='0'
					left='0'
					zIndex={101}
					h='4px'
					bg='accent.pink'
					transition='width .1s ease'
					style={{ width: `${percentage}%` }}
				/>
			)}
		</Box>
	);
};

export default ProgressIndicator;
