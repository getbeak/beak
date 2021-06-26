import FixProjectEncryption from '@beak/app/features/alerts/components/FixProjectEncryption';
import { alertRemoveType } from '@beak/app/store/project/actions';
import { Alert } from '@beak/app/store/project/types';
import React, { useState } from 'react';
import { useDispatch } from 'react-redux';

import AlertItem from '../molecules/AlertItem';

interface AlertSwitchProps {
	alert: Alert;
}

const AlertSwitch: React.FunctionComponent<AlertSwitchProps> = ({ alert }) => {
	const [fixer, setFixer] = useState<undefined | 'encryption'>();
	const dispatch = useDispatch();

	switch (alert.type) {
		case 'missing_encryption':
			return (
				<React.Fragment>
					<AlertItem
						title={'Project encryption issue'}
						description={'The encryption key for your project is missing'}
						action={{
							cta: 'Fix',
							callback: () => setFixer('encryption'),
						}}
					/>

					{fixer === 'encryption' && (
						<FixProjectEncryption
							onClose={() => {
								setFixer(void 0);
								dispatch(alertRemoveType('missing_encryption'));
							}}
						/>
					)}
				</React.Fragment>
			);

		default:
			return <AlertItem title={'Unknown alert'} description={`Alert renderer missing for ${alert.type}`} />;
	}
};

export default AlertSwitch;
