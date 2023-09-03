import React, { useRef, useState } from 'react';
import { useAppSelector } from '@beak/ui/store/redux';
import { TypedObject } from '@beak/common/helpers/typescript';
import { faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useTheme } from 'styled-components';

import ActionBarButton from '../atoms/ActionBarButton';
import AlertsPopover from '../organisms/AlertsPopover';

interface ActionBarAlertButtonProps {
	id: string;
}

const ActionBarAlertButton: React.FC<ActionBarAlertButtonProps> = ({ id }) => {
	const theme = useTheme();
	const [showPopover, setShowPopover] = useState(false);
	const alerts = useAppSelector(s => s.global.project.alerts);
	const hasAlerts = TypedObject.values(alerts).filter(Boolean).length > 0;
	const parentRef = useRef() as React.MutableRefObject<HTMLButtonElement>;

	if (!hasAlerts)
		return null;

	return (
		<React.Fragment>
			<ActionBarButton id={id} ref={parentRef}>
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
