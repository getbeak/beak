import { Box } from '@chakra-ui/react';
import { useAppSelector } from '@beak/ui/store/redux';
import { AnimatePresence, motion } from 'framer-motion';
import * as React from 'react';

const MotionDiv = motion.div;

const ProgressIndicator: React.FC = () => {
	const selectedTab = useAppSelector(s => s.features.tabs.selectedTab);
	const activeFlight = useAppSelector(s => (selectedTab ? s.global.flight.activeFlights[selectedTab] : undefined));

	const percentage = activeFlight?.bodyTransferPercentage ?? 0;

	return (
		<Box position='relative' h='2px' overflow='visible' zIndex={50}>
			<AnimatePresence>
				{activeFlight && (
					<MotionDiv
						key='progress'
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						transition={{ duration: 0.16 }}
						style={{
							position: 'absolute',
							top: 0,
							left: 0,
							zIndex: 101,
							height: 2,
							width: `${percentage}%`,
							transition: 'width 140ms cubic-bezier(.4, 0, .2, 1)',
							background:
								'linear-gradient(90deg, var(--beak-colors-accent-pink), var(--beak-colors-accent-teal), var(--beak-colors-accent-indigo), var(--beak-colors-accent-pink))',
							backgroundSize: '300% 100%',
							animation: 'beakProgressShimmer 2.4s linear infinite',
							boxShadow: '0 0 12px color-mix(in srgb, var(--beak-colors-accent-pink) 60%, transparent), 0 0 4px color-mix(in srgb, var(--beak-colors-accent-teal) 40%, transparent)',
							borderTopRightRadius: '2px',
							borderBottomRightRadius: '2px',
						}}
					/>
				)}
			</AnimatePresence>
		</Box>
	);
};

export default ProgressIndicator;
