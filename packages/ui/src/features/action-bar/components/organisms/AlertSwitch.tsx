import FixProjectEncryption from '@beak/ui/features/encryption/components/FixProjectEncryption';
import ViewExtensionError from '@beak/ui/features/extension/components/ViewExtensionError';
import { alertRemoveType } from '@beak/ui/store/project/actions';
import type { Alert } from '@beak/ui/store/project/types';
import React, { useState } from 'react';
import { useDispatch } from 'react-redux';

import AlertItem from '../molecules/AlertItem';

interface AlertSwitchProps {
	alert: Alert;
}

const AlertSwitch: React.FC<React.PropsWithChildren<AlertSwitchProps>> = ({ alert }) => {
	const [fixer, setFixer] = useState<undefined | 'encryption' | 'extension_issue'>();
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
							onClose={resolved => {
								setFixer(void 0);

								if (resolved) dispatch(alertRemoveType('missing_encryption'));
							}}
						/>
					)}
				</React.Fragment>
			);

		case 'http_body_not_allowed':
			return (
				<AlertItem
					title={'HTTP verb doesn’t allow a body'}
					description={'GET, HEAD, and OPTIONS requests can’t include a body. Switch verb or clear the body to send.'}
				/>
			);

		case 'invalid_extension':
			return (
				<React.Fragment>
					<AlertItem
						title={'Unable to load extension'}
						description={`“${alert.payload.assumedName}” has encountered an error`}
						action={{
							cta: 'View',
							callback: () => setFixer('extension_issue'),
						}}
					/>

					{fixer === 'extension_issue' && (
						<ViewExtensionError
							assumedName={alert.payload.assumedName}
							error={alert.payload.error}
							filePath={alert.payload.filePath}
							onClose={() => setFixer(void 0)}
						/>
					)}
				</React.Fragment>
			);

		default:
			return <AlertItem title={'Unknown alert'} description={`Alert renderer missing for ${(alert as { type: string }).type}`} />;
	}
};

export default AlertSwitch;
