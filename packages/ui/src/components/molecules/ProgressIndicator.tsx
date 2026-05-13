import { Box } from '@chakra-ui/react';
import { useAppSelector } from '@beak/ui/store/redux';
import { motion } from 'framer-motion';
import * as React from 'react';

const ProgressIndicator: React.FC = () => {
	const selectedTab = useAppSelector(s => s.features.tabs.selectedTab);
	const activeFlight = useAppSelector(s => (selectedTab ? s.global.flight.activeFlights[selectedTab] : undefined));

	const percentage = activeFlight?.bodyTransferPercentage ?? 0;

	return (
		<Box position='relative' h='2px' overflow='hidden'>
			{activeFlight && (
				<motion.div
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					style={{
						position: 'absolute',
						top: 0,
						left: 0,
						zIndex: 101,
						height: 2,
						width: `${percentage}%`,
						transition: 'width 120ms ease',
						background:
							'linear-gradient(90deg, var(--beak-colors-accent-pink), var(--beak-colors-accent-teal), var(--beak-colors-accent-pink))',
						backgroundSize: '200% 100%',
						animation: 'beakProgressShimmer 1.8s linear infinite',
						boxShadow: '0 0 8px var(--beak-colors-accent-pink)',
					}}
				/>
			)}
			<Box
				as='style'
				dangerouslySetInnerHTML={{
					__html:
						'@keyframes beakProgressShimmer { 0% { background-position: 0% 0; } 100% { background-position: 200% 0; } }',
				}}
			/>
		</Box>
	);
};

export default ProgressIndicator;
