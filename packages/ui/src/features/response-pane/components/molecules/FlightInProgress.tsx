import { Box, Flex } from '@chakra-ui/react';
import type { FlightInProgress as FlightInProgressType } from '@beak/state/flight';
import * as React from 'react';

interface FlightInProgressProps {
	requestId: string;
	currentFlight: FlightInProgressType | undefined;
}

const FlightInProgress: React.FC<FlightInProgressProps> = ({ currentFlight, requestId }) => {
	const shown = Boolean(currentFlight && currentFlight.requestId === requestId);

	return (
		<Flex
			position='absolute'
			pointerEvents='none'
			inset='0'
			align='center'
			justify='center'
			bg='bg.canvas'
			textAlign='center'
			transition='opacity .2s ease-out'
			opacity={shown ? 1 : 0}
			css={{
				'@keyframes beakFlightPulse': {
					'0%': { transform: 'scale(.33)' },
					'80%': { opacity: 0 },
					'100%': { opacity: 0 },
				},
			}}
		>
			<Box w='50px' h='50px' position='relative'>
				<Box
					position='absolute'
					top='-100px'
					left='-100px'
					w='250px'
					h='250px'
					borderRadius='full'
					bg='accent.pink'
					animation='beakFlightPulse 1.25s cubic-bezier(0.215, 0.61, 0.355, 1) infinite'
				/>
				<Box
					position='absolute'
					top='0'
					left='0'
					w='50px'
					h='50px'
					bgImage="url('images/logo.svg')"
					bgSize='45px'
					bgPos='center'
					bgRepeat='no-repeat'
					opacity={0.8}
				/>
			</Box>
		</Flex>
	);
};

export default FlightInProgress;
