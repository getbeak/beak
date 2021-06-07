import { TypedObject } from '@beak/common/helpers/typescript';
import { faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, { useRef,useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTheme } from 'styled-components';

import ActionBarButton from '../atoms/ActionBarButton';
import AlertsPopover from '../organisms/AlertsPopover';

const ActionBarAlertButton: React.FunctionComponent = () => {
	const dispatch = useDispatch();
	const theme = useTheme();
	const [showPopover, setShowPopover] = useState(true);
	const alerts = useSelector(s => s.global.project.alerts);
	const hasAlerts = TypedObject.keys(alerts).length > 0;
	const parentRef = useRef() as React.MutableRefObject<HTMLButtonElement>;

	return (
		<React.Fragment>
			<ActionBarButton ref={parentRef}>
				<FontAwesomeIcon
					color={hasAlerts ? 'orange' : theme.ui.textMinor}
					size={'1x'}
					icon={faExclamationTriangle}
					onClick={() => setShowPopover(true)}
				/>
			</ActionBarButton>

			{parentRef.current && showPopover && (
				<AlertsPopover
					parent={parentRef.current}
					onClose={() => setShowPopover(false)}
				/>
			)}
		</React.Fragment>
	);
};

export default ActionBarAlertButton;
