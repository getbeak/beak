import { Box } from '@chakra-ui/react';
import { statusToColor } from '@beak/design-system/helpers';
import { AnimatePresence, motion } from 'framer-motion';
import { CircleCheck, CircleDot, CircleX, Loader2 } from 'lucide-react';
import React from 'react';

import { useSelectedTabFlightStatus } from '../../../../services/flight/tab-integration';

const ActionBarFlightStatus: React.FC = () => {
	const flightStatus = useSelectedTabFlightStatus();

	function renderInner() {
		switch (flightStatus.status) {
			case 'active':
				return (
					<motion.div
						key='active'
						initial={{ opacity: 0, scale: 0.8 }}
						animate={{ opacity: 1, scale: 1 }}
						exit={{ opacity: 0, scale: 0.8 }}
						transition={{ duration: 0.12 }}
						style={{
							display: 'inline-flex',
							color: 'var(--beak-colors-accent-pink)',
							filter: 'drop-shadow(0 0 4px color-mix(in srgb, var(--beak-colors-accent-pink) 55%, transparent))',
						}}
					>
						<Loader2
							id='tt-action-bar-flight-status-active'
							tabIndex={-1}
							size={14}
							style={{ animation: 'spin 1s linear infinite' }}
						/>
					</motion.div>
				);

			case 'complete': {
				const failure = flightStatus.httpStatus > 399;
				const tooltipId = failure ? 'tt-action-bar-flight-status-server-failed' : 'tt-action-bar-flight-status-success';
				const Icon = failure ? CircleX : CircleCheck;
				return (
					<motion.div
						key={`complete-${flightStatus.httpStatus}`}
						initial={{ opacity: 0, scale: 0.6 }}
						animate={{ opacity: 1, scale: 1 }}
						exit={{ opacity: 0, scale: 0.8 }}
						transition={{ type: 'spring', stiffness: 700, damping: 26 }}
						style={{ display: 'inline-flex' }}
					>
						<Icon id={tooltipId} color={statusToColor(flightStatus.httpStatus)} tabIndex={-1}
							size={14} />
					</motion.div>
				);
			}

			case 'failed':
				return (
					<motion.div
						key='failed'
						initial={{ opacity: 0, scale: 0.6 }}
						animate={{ opacity: 1, scale: 1 }}
						exit={{ opacity: 0, scale: 0.8 }}
						transition={{ type: 'spring', stiffness: 700, damping: 26 }}
						style={{ display: 'inline-flex' }}
					>
						<CircleX
							id='tt-action-bar-flight-status-failed'
							color='var(--beak-colors-accent-alert)'
							tabIndex={-1}
							size={14}
						/>
					</motion.div>
				);

			default:
				return (
					<motion.div
						key='pending'
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						transition={{ duration: 0.12 }}
						style={{ display: 'inline-flex', color: 'var(--beak-colors-fg-muted)' }}
					>
						<CircleDot id='tt-action-bar-flight-status-pending' tabIndex={-1}
							size={14} />
					</motion.div>
				);
		}
	}

	return (
		<Box display='inline-flex' alignItems='center' mx='1' css={{ '@keyframes spin': { '0%': { transform: 'rotate(0deg)' }, '100%': { transform: 'rotate(360deg)' } } }}>
			<AnimatePresence mode='wait'>{renderInner()}</AnimatePresence>
		</Box>
	);
};

export default ActionBarFlightStatus;
