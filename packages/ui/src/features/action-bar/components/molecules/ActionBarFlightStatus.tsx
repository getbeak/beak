import { statusToColor } from '@beak/design-system/helpers';
import BeakTooltip from '@beak/ui/components/atoms/BeakTooltip';
import { Box } from '@chakra-ui/react';
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
					<BeakTooltip content='Flight in progress'>
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
							<Loader2 tabIndex={-1} size={14} style={{ animation: 'beakSpin 1s linear infinite' }} />
						</motion.div>
					</BeakTooltip>
				);

			case 'complete': {
				const failure = flightStatus.httpStatus > 399;
				const tooltipText = failure ? 'Server returned an error response' : 'Flight complete';
				const Icon = failure ? CircleX : CircleCheck;
				const statusColor = statusToColor(flightStatus.httpStatus);
				return (
					<BeakTooltip content={tooltipText}>
						<motion.div
							key={`complete-${flightStatus.httpStatus}`}
							initial={{ opacity: 0, scale: 0.6 }}
							animate={{ opacity: 1, scale: 1 }}
							exit={{ opacity: 0, scale: 0.8 }}
							transition={{ type: 'spring', stiffness: 700, damping: 26 }}
							style={{
								display: 'inline-flex',
								filter: `drop-shadow(0 0 4px color-mix(in srgb, ${statusColor} 50%, transparent))`,
							}}
						>
							<Icon color={statusColor} tabIndex={-1} size={14} />
						</motion.div>
					</BeakTooltip>
				);
			}

			case 'failed':
				return (
					<BeakTooltip content='Flight failed — request could not be sent'>
						<motion.div
							key='failed'
							initial={{ opacity: 0, scale: 0.6 }}
							animate={{ opacity: 1, scale: 1 }}
							exit={{ opacity: 0, scale: 0.8 }}
							transition={{ type: 'spring', stiffness: 700, damping: 26 }}
							style={{
								display: 'inline-flex',
								filter: 'drop-shadow(0 0 4px color-mix(in srgb, var(--beak-colors-accent-alert) 50%, transparent))',
							}}
						>
							<CircleX color='var(--beak-colors-accent-alert)' tabIndex={-1} size={14} />
						</motion.div>
					</BeakTooltip>
				);

			default:
				return (
					<BeakTooltip content='Awaiting flight…'>
						<motion.div
							key='pending'
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0 }}
							transition={{ duration: 0.12 }}
							style={{ display: 'inline-flex', color: 'var(--beak-colors-fg-muted)' }}
						>
							<CircleDot tabIndex={-1} size={14} />
						</motion.div>
					</BeakTooltip>
				);
		}
	}

	return (
		<Box display='inline-flex' alignItems='center' mx='1' role='status' aria-live='polite' aria-label='Flight status'>
			<AnimatePresence mode='wait'>{renderInner()}</AnimatePresence>
		</Box>
	);
};

export default ActionBarFlightStatus;
