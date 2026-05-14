import { Box, Flex } from '@chakra-ui/react';
import type { FlightInProgress as FlightInProgressType } from '@beak/state/flight';
import { AnimatePresence, motion } from 'framer-motion';
import * as React from 'react';

interface FlightInProgressProps {
	requestId: string;
	currentFlight: FlightInProgressType | undefined;
}

const MotionFlex = motion.create(Flex);
const MotionBox = motion.create(Box);

const FlightInProgress: React.FC<FlightInProgressProps> = ({ currentFlight, requestId }) => {
	const shown = Boolean(currentFlight && currentFlight.requestId === requestId);

	return (
		<AnimatePresence>
			{shown && (
				<MotionFlex
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					exit={{ opacity: 0 }}
					transition={{ duration: 0.2, ease: 'easeOut' }}
					position='absolute'
					inset='0'
					align='center'
					justify='center'
					pointerEvents='none'
					textAlign='center'
					zIndex={3}
					css={{
						background:
							'color-mix(in srgb, var(--beak-colors-bg-canvas) 58%, transparent)',
						backdropFilter: 'blur(14px) saturate(160%)',
					}}
				>
					<Flex direction='column' align='center' gap='4'>
						<Box position='relative' w='80px' h='80px'>
							<Box
								position='absolute'
								inset='0'
								borderRadius='full'
								bg='color-mix(in srgb, var(--beak-colors-accent-pink) 50%, transparent)'
								animation='beakFlightOuter 1.6s cubic-bezier(0.215, 0.61, 0.355, 1) infinite'
							/>
							<Box
								position='absolute'
								inset='0'
								borderRadius='full'
								bg='color-mix(in srgb, var(--beak-colors-accent-pink) 70%, transparent)'
								animation='beakFlightInner 1.6s cubic-bezier(0.215, 0.61, 0.355, 1) 0.4s infinite'
							/>
							<MotionBox
								position='absolute'
								inset='0'
								borderRadius='full'
								bg='bg.surface'
								borderWidth='1px'
								borderColor='color-mix(in srgb, var(--beak-colors-accent-pink) 55%, var(--beak-colors-border-subtle))'
								boxShadow='0 10px 28px color-mix(in srgb, var(--beak-colors-accent-pink) 38%, rgba(0,0,0,0.2)), inset 0 1px 0 color-mix(in srgb, white 22%, transparent)'
								animate={{ scale: [1, 1.04, 1] }}
								transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
								css={{
									backgroundImage: "url('images/logo.svg')",
									backgroundSize: '36px',
									backgroundPosition: 'center',
									backgroundRepeat: 'no-repeat',
								}}
							/>
						</Box>
						<Flex direction='column' align='center' gap='1'>
							<Box fontSize='sm' fontWeight='600' color='fg.default' letterSpacing='-0.005em'>
								{'Sending request…'}
							</Box>
							<Box fontSize='10px' color='accent.pink' letterSpacing='0.08em' textTransform='uppercase' fontWeight='700'>
								{'Awaiting response'}
							</Box>
						</Flex>
					</Flex>
				</MotionFlex>
			)}
		</AnimatePresence>
	);
};

export default FlightInProgress;
