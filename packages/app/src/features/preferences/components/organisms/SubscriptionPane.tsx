import { ipcNestService } from '@beak/app/lib/ipc';
import { GetSubscriptionStatusResponse } from '@beak/common/types/nest';
import Squawk from '@beak/common/utils/squawk';
import React, { useEffect, useState } from 'react';

import NoActiveSubscription from '../molecules/NoActiveSubscription';
import NotSignedIn from '../molecules/NotSignedIn';
import Pane from '../molecules/Pane';
import SubscriptionInformation from '../molecules/SubscriptionInformation';

const SubscriptionPane: React.FunctionComponent = () => {
	const [response, setResponse] = useState<GetSubscriptionStatusResponse | null>(null);
	const [error, setError] = useState<Squawk | null>(null);
	const fetching = response === null && error === null;

	// States
	const notSignedIn = error?.code === 'not_authenticated';
	const noActiveSubscription = error?.code === 'no_active_subscription';

	useEffect(() => {
		ipcNestService.getSubscriptionState()
			.then(setResponse)
			.catch(setError);
	}, []);

	return (
		<Pane title={'Subscription'}>
			{fetching && 'Loading...'}
			{response && <SubscriptionInformation subscription={response} />}
			{error && (
				<React.Fragment>
					{notSignedIn && <NotSignedIn />}
					{noActiveSubscription && <NoActiveSubscription />}
					{!noActiveSubscription && !notSignedIn && `Unable to load subscription information (${error.code})`}
				</React.Fragment>
			)}
		</Pane>
	);
};

export default SubscriptionPane;
