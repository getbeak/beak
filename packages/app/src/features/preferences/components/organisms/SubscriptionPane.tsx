import { ipcNestService } from '@beak/app/lib/ipc';
import { GetSubscriptionStatusResponse } from '@beak/common/types/nest';
import Squawk from '@beak/common/utils/squawk';
import React, { useEffect, useState } from 'react';

import NotSignedIn from '../molecules/NotSignedIn';
import Pane from '../molecules/Pane';

const SubscriptionPane: React.FunctionComponent = () => {
	const [response, setResponse] = useState<GetSubscriptionStatusResponse | null>(null);
	const [error, setError] = useState<Squawk | null>(null);
	const fetching = response === null && error === null;

	// States
	const notSignedIn = error?.code === 'not_authenticated';

	useEffect(() => {
		ipcNestService.getSubscriptionState()
			.then(setResponse)
			.catch(setError);
	}, []);

	return (
		<Pane title={'Subscription'}>
			{fetching && 'Loading...'}
			{response && 'Has sub'}
			{error && (
				<React.Fragment>
					{notSignedIn && <NotSignedIn />}
					{!notSignedIn && `Unknown error (${error.code})`}
				</React.Fragment>
			)}
		</Pane>
	);
};

export default SubscriptionPane;
