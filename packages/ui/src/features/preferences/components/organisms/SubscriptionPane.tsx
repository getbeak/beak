import { Box, Flex, Spinner } from '@chakra-ui/react';
import type { GetSubscriptionStatusResponse } from '@beak/common/types/nest';
import type Squawk from '@beak/common/utils/squawk';
import { ipcNestService } from '@beak/ui/lib/ipc';
import { AlertOctagon } from 'lucide-react';
import React, { useEffect, useState } from 'react';

import NoActiveSubscription from '../molecules/NoActiveSubscription';
import NotSignedIn from '../molecules/NotSignedIn';
import Pane from '../molecules/Pane';
import SubscriptionInformation from '../molecules/SubscriptionInformation';

const SubscriptionPane: React.FC<React.PropsWithChildren<unknown>> = () => {
	const [response, setResponse] = useState<GetSubscriptionStatusResponse | null>(null);
	const [error, setError] = useState<Squawk | null>(null);
	const fetching = response === null && error === null;

	// States
	const notSignedIn = error?.code === 'not_authenticated';
	const noActiveSubscription = error?.code === 'no_active_subscription';
	const unknownError = error && !notSignedIn && !noActiveSubscription;

	useEffect(() => {
		ipcNestService.getSubscriptionState().then(setResponse).catch(setError);
	}, []);

	return (
		<Pane title={'Subscription'}>
			{fetching && (
				<Flex align='center' gap='2' py='4' color='fg.muted'>
					<Spinner size='sm' color='accent.pink' />
					<Box fontSize='sm'>{'Checking subscription…'}</Box>
				</Flex>
			)}
			{response && <SubscriptionInformation subscription={response} />}
			{notSignedIn && <NotSignedIn />}
			{noActiveSubscription && <NoActiveSubscription />}
			{unknownError && (
				<Flex
					align='flex-start'
					gap='2'
					p='3'
					borderRadius='md'
					borderWidth='1px'
					borderColor='color-mix(in srgb, var(--beak-colors-accent-alert) 28%, var(--beak-colors-border-subtle))'
					bg='color-mix(in srgb, var(--beak-colors-accent-alert) 6%, var(--beak-colors-bg-surface))'
				>
					<Box color='accent.alert' mt='0.5'>
						<AlertOctagon size={14} />
					</Box>
					<Box>
						<Box fontSize='sm' fontWeight='600' color='fg.default'>
							{'Unable to load subscription'}
						</Box>
						<Box fontSize='xs' color='fg.muted' fontFamily='mono' mt='0.5'>
							{error?.code}
						</Box>
					</Box>
				</Flex>
			)}
		</Pane>
	);
};

export default SubscriptionPane;
