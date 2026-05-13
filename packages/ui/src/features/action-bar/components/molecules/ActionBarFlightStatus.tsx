import { statusToColor } from '@beak/design-system/helpers';
import { CircleCheck, CircleDot, CircleX, Loader2 } from 'lucide-react';
import React from 'react';

import { useSelectedTabFlightStatus } from '../../../../services/flight/tab-integration';

const ActionBarFlightStatus: React.FC = () => {
	const flightStatus = useSelectedTabFlightStatus();

	switch (flightStatus.status) {
		case 'active':
			return (
				<Loader2
					id='tt-action-bar-flight-status-active'
					tabIndex={-1}
					style={{ animation: 'spin 1s linear infinite' }}
				/>
			);

		case 'complete': {
			const failure = flightStatus.httpStatus > 399;
			const tooltipId = failure ? 'tt-action-bar-flight-status-server-failed' : 'tt-action-bar-flight-status-success';
			const Icon = failure ? CircleX : CircleCheck;

			return (
				<Icon
					id={tooltipId}
					color={statusToColor(flightStatus.httpStatus)}
					tabIndex={-1}
				/>
			);
		}

		case 'failed':
			return (
				<CircleX
					id='tt-action-bar-flight-status-failed'
					color='var(--beak-colors-accent-alert)'
					tabIndex={-1}
				/>
			);

		default:
			return <CircleDot id='tt-action-bar-flight-status-pending' tabIndex={-1} />;
	}
};

export default ActionBarFlightStatus;
