import { Alert } from '@beak/app/store/project/types';
import React from 'react';

import AlertItem from '../molecules/AlertItem';

interface AlertSwitchProps {
	alert: Alert;
}

const AlertSwitch: React.FunctionComponent<AlertSwitchProps> = ({ alert }) => {
	switch (alert.type) {
		case 'missing_encryption':
			return (
				<AlertItem
					title={'Project encryption issue'}
					description={'The encryption key for your project is missing'}
					action={{
						cta: 'Fix',
						callback: () => {
							
						},
					}}
				/>
			);

		default:
			return <AlertItem title={'Unknown alert'} description={`Alert renderer missing for ${alert.type}`} />;
	}
};

export default AlertSwitch;
