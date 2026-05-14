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
				<Flex align='center' gap='2' py='4'>
					<Spinner
						size='sm'
						color='accent.pink'
						style={{ filter: 'drop-shadow(0 0 4px color-mix(in srgb, var(--beak-colors-accent-pink) 50%, transparent))' }}
					/>
					<Box
						fontSize='10px'
						fontWeight='700'
						letterSpacing='0.06em'
						textTransform='uppercase'
						color='accent.pink'
					>
						{'Checking subscription…'}
					</Box>
				</Flex>
			)}
			{response && <SubscriptionInformation subscription={response} />}
			{notSignedIn && <NotSignedIn />}
			{noActiveSubscription && <NoActiveSubscription />}
			{unknownError && (
				<Flex
					align='flex-start'
					gap='2.5'
					p='3'
					borderRadius='md'
					borderWidth='1px'
					borderColor='color-mix(in srgb, var(--beak-colors-accent-alert) 28%, var(--beak-colors-border-subtle))'
					bg='color-mix(in srgb, var(--beak-colors-accent-alert) 6%, var(--beak-colors-bg-surface))'
				>
					<Flex
						flex='0 0 auto'
						align='center'
						justify='center'
						w='28px'
						h='28px'
						borderRadius='md'
						bg='color-mix(in srgb, var(--beak-colors-accent-alert) 14%, transparent)'
						borderWidth='1px'
						borderColor='color-mix(in srgb, var(--beak-colors-accent-alert) 28%, transparent)'
						color='accent.alert'
						boxShadow='0 3px 8px color-mix(in srgb, var(--beak-colors-accent-alert) 18%, transparent), inset 0 1px 0 color-mix(in srgb, white 14%, transparent)'
					>
						<AlertOctagon size={14} strokeWidth={2} />
					</Flex>
					<Box flex='1 1 auto' minW={0}>
						<Box fontSize='sm' fontWeight='600' color='fg.default'>
							{'Unable to load subscription'}
						</Box>
						<Box fontSize='10px' fontWeight='700' letterSpacing='0.06em' textTransform='uppercase' color='accent.alert' fontFamily='mono' mt='0.5'>
							{error?.code}
						</Box>
					</Box>
				</Flex>
			)}
		</Pane>
	);
};

export default SubscriptionPane;
