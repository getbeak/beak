import React from 'react';
import { statusToColor } from '@beak/design-system/helpers';
import { faCircleCheck, faCircleDot, faCircleXmark, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useTheme } from 'styled-components';

import useFlightStatus from '../../hooks/use-flight-status';

const ActionBarFlightStatus: React.FC<React.PropsWithChildren<unknown>> = () => {
	const theme = useTheme();
	const flightStatus = useFlightStatus();

	switch (flightStatus.status) {
		case 'active':
			return (
				<FontAwesomeIcon
					id={'#tt-action-bar-flight-status-active'}
					icon={faSpinner}
					size={'1x'}
					spin
				/>
			);

		case 'complete': {
			const failure = flightStatus.httpStatus > 399;
			const tooltipId = failure ? 'tt-action-bar-flight-status-server-failed' : 'tt-action-bar-flight-status-success';

			return (
				<FontAwesomeIcon
					id={tooltipId}
					icon={failure ? faCircleXmark : faCircleCheck}
					color={statusToColor(theme, flightStatus.httpStatus)}
					size={'1x'}
				/>
			);
		}

		case 'failed':
			return (
				<FontAwesomeIcon
					id={'tt-action-bar-flight-status-failed'}
					icon={faCircleXmark}
					color={theme.ui.destructiveAction}
					size={'1x'}
				/>
			);

		case 'pending':
		default:
			return (
				<FontAwesomeIcon
					id={'tt-action-bar-flight-status-pending'}
					icon={faCircleDot}
					size={'1x'}
				/>
			);
	}
};

export default ActionBarFlightStatus;
