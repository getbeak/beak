import React from 'react';
import { statusToColor } from '@beak/design-system/helpers';
import { faCircleCheck, faCircleNotch, faCircleXmark, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useTheme } from 'styled-components';

import useFlightStatus from '../../hooks/use-flight-status';

const ActionBarFlightStatus: React.FunctionComponent = () => {
	const theme = useTheme();
	const flightStatus = useFlightStatus();

	switch (flightStatus.status) {
		case 'active':
			return (
				<abbr title={'Flight in progress...'}>
					<FontAwesomeIcon
						icon={faSpinner}
						size={'1x'}
						spin
					/>
				</abbr>
			);

		case 'complete': {
			const failure = flightStatus.httpStatus > 399;

			return (
				<abbr title={`Flight ${failure ? 'failed successfully' : 'complete'}`}>
					<FontAwesomeIcon
						icon={failure ? faCircleXmark : faCircleCheck}
						color={statusToColor(theme, flightStatus.httpStatus)}
						size={'1x'}
					/>
				</abbr>
			);
		}

		case 'failed':
			return (
				<abbr title={'Flight failed'}>
					<FontAwesomeIcon
						icon={faCircleXmark}
						size={'1x'}
					/>
				</abbr>
			);

		case 'pending':
		default:
			return (
				<abbr title={'Awaiting flight...'}>
					<FontAwesomeIcon
						icon={faCircleNotch}
						size={'1x'}
					/>
				</abbr>
			);
	}
};

export default ActionBarFlightStatus;