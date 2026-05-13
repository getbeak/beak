import { Box, Grid } from '@chakra-ui/react';
import type { GetSubscriptionStatusResponse } from '@beak/common/types/nest';
import Button from '@beak/ui/components/atoms/Button';
import { ipcExplorerService } from '@beak/ui/lib/ipc';
import { formatDistance } from 'date-fns';
import * as React from 'react';

export interface SubscriptionInformationProps {
	subscription: GetSubscriptionStatusResponse;
}

const SubscriptionInformation: React.FC<SubscriptionInformationProps> = ({ subscription }) => {
	const trial = subscription.status === 'trialing';

	return (
		<Grid
			templateRows='1fr'
			templateColumns='0.15fr 0.5fr 0.4fr'
			borderRadius='lg'
			p='5'
			bg='bg.surface.emphasized'
		>
			<Box gridColumn={1}>
				<Box
					borderRadius='full'
					w='60px'
					h='60px'
					bg='bg.canvas.alt'
					bgImage="url('images/logo.svg')"
					bgRepeat='no-repeat'
					bgPos='center'
					bgSize='35px'
				/>
			</Box>
			<Box gridColumn={2}>
				{trial ? (
					<React.Fragment>
						<Box fontSize='2xl' fontWeight='medium' color='fg.default'>{'Beak subscription trial'}</Box>
						<Box fontSize='lg' mt='1.5' mb='5' color='fg.muted'>{'Your Beak subscription trial'}</Box>
					</React.Fragment>
				) : (
					<React.Fragment>
						<Box fontSize='2xl' fontWeight='medium' color='fg.default'>{'Beak subscription'}</Box>
						<Box fontSize='lg' mt='1.5' mb='5' color='fg.muted'>{'Your current Beak subscription'}</Box>
					</React.Fragment>
				)}

				{subscription.billingPortalUrl && (
					<Button onClick={() => ipcExplorerService.launchUrl(subscription.billingPortalUrl!)}>
						{'Visit billing portal'}
					</Button>
				)}
			</Box>
			<Box gridColumn={3} textAlign='right'>
				{trial ? (
					<React.Fragment>
						<Box as='span' fontWeight='semibold' fontSize='xl' color='fg.default'>{'Trial ends'}</Box>
						<br />
						<Box as='span' color='fg.muted' fontSize='md'>
							{formatDistance(new Date(subscription.endDate!), new Date(), { addSuffix: true })}
						</Box>
					</React.Fragment>
				) : (
					<React.Fragment>
						<Box as='span' fontWeight='semibold' fontSize='xl' color='fg.default'>{'$25.00'}</Box>
						<Box as='span' color='fg.muted' fontSize='md'>{' / year'}</Box>
					</React.Fragment>
				)}
			</Box>
		</Grid>
	);
};

export default SubscriptionInformation;
