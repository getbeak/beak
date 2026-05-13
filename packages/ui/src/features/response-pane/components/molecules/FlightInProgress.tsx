import { Box, Flex } from '@chakra-ui/react';
import type { FlightInProgress as FlightInProgressType } from '@beak/state/flight';
import { AnimatePresence, motion } from 'framer-motion';
import * as React from 'react';

interface FlightInProgressProps {
	requestId: string;
	currentFlight: FlightInProgressType | undefined;
}

const MotionFlex = motion.create(Flex);

const FlightInProgress: React.FC<FlightInProgressProps> = ({ currentFlight, requestId }) => {
	const shown = Boolean(currentFlight && currentFlight.requestId === requestId);

	return (
		<AnimatePresence>
			{shown && (
				<MotionFlex
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					exit={{ opacity: 0 }}
					transition={{ duration: 0.18, ease: 'easeOut' }}
					position='absolute'
					inset='0'
					align='center'
					justify='center'
					pointerEvents='none'
					textAlign='center'
					css={{
						background:
							'color-mix(in srgb, var(--beak-colors-bg-canvas) 70%, transparent)',
						backdropFilter: 'blur(6px)',
						'@keyframes beakFlightPulse': {
							'0%': { transform: 'scale(.33)' },
							'80%': { opacity: 0 },
							'100%': { opacity: 0 },
						},
						'@keyframes beakFlightShimmer': {
							'0%': { backgroundPosition: '-200px 0' },
							'100%': { backgroundPosition: 'calc(200px + 100%) 0' },
						},
					}}
				>
					<Box position='relative' display='flex' flexDirection='column' alignItems='center' gap='4'>
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
						<Box fontSize='xs' color='fg.muted' letterSpacing='0.05em'>
							{'Awaiting response…'}
						</Box>
					</Box>
				</MotionFlex>
			)}
		</AnimatePresence>
	);
};

export default FlightInProgress;
