import { Box } from '@chakra-ui/react';
import { TypedObject } from '@beak/common/helpers/typescript';
import { useAppSelector } from '@beak/ui/store/redux';
import * as React from 'react';
import { createPortal } from 'react-dom';
import * as uuid from 'uuid';

import AlertSwitch from './AlertSwitch';

interface AlertsPopoverProps {
	parent: HTMLButtonElement;
	onClose: () => void;
}

const AlertsPopover: React.FC<AlertsPopoverProps> = ({ parent, onClose }) => {
	const alerts = useAppSelector(s => s.global.project.alerts);
	const hasAlerts = TypedObject.values(alerts).filter(Boolean).length > 0;
	const boundingRect = parent.getBoundingClientRect();

	return createPortal(
		<Box position='fixed' inset='0' onClick={() => onClose()}>
			<Box
				position='fixed'
				w='300px'
				borderWidth='1px'
				borderColor='border.default'
				borderRadius='md'
				bg='bg.surface'
				zIndex={101}
				style={{
					marginTop: `${boundingRect.top + parent.clientHeight + 5}px`,
					marginLeft: `${boundingRect.left - 300 + 30}px`,
				}}
				onClick={event => event.stopPropagation()}
			>
				{!hasAlerts && (
					<Box as='span' display='block' px='3' py='2' fontSize='lg'>
						{'You have no alerts 🎉'}
					</Box>
				)}
				{hasAlerts &&
					TypedObject.values(alerts)
						.filter(Boolean)
						.map(alert => <AlertSwitch key={uuid.v4()} alert={alert!} />)}
			</Box>
		</Box>,
		document.getElementById('action-alerts-popover')!,
	);
};

export default AlertsPopover;
