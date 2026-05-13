import { Box, Flex } from '@chakra-ui/react';
import type { GetSubscriptionStatusResponse } from '@beak/common/types/nest';
import Button from '@beak/ui/components/atoms/Button';
import { ipcExplorerService } from '@beak/ui/lib/ipc';
import { formatDistance } from 'date-fns';
import { motion } from 'framer-motion';
import * as React from 'react';

export interface SubscriptionInformationProps {
	subscription: GetSubscriptionStatusResponse;
}

const MotionFlex = motion.create(Flex);

const SubscriptionInformation: React.FC<SubscriptionInformationProps> = ({ subscription }) => {
	const trial = subscription.status === 'trialing';

	return (
		<MotionFlex
			initial={{ opacity: 0, y: 6 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.2, ease: 'easeOut' }}
			align='center'
			gap='4'
			p='4'
			borderRadius='lg'
			borderWidth='1px'
			borderColor='border.subtle'
			bg='color-mix(in srgb, var(--beak-colors-bg-surface) 60%, transparent)'
			css={{ borderLeft: '3px solid var(--beak-colors-accent-pink)' }}
		>
			<Box
				flex='0 0 auto'
				borderRadius='full'
				w='52px'
				h='52px'
				bg='bg.canvas'
				bgImage="url('images/logo.svg')"
				bgRepeat='no-repeat'
				bgPos='center'
				bgSize='30px'
				borderWidth='1px'
				borderColor='border.subtle'
			/>
			<Box flex='1 1 auto' minW={0}>
				<Box fontSize='md' fontWeight='600' color='fg.default'>
					{trial ? 'Beak subscription trial' : 'Beak subscription'}
				</Box>
				<Box fontSize='xs' color='fg.muted' mt='0.5' mb='2'>
					{trial ? 'Your free trial is active' : 'Your active Beak subscription'}
				</Box>
				{subscription.billingPortalUrl && (
					<Button
						size='sm'
						onClick={() => ipcExplorerService.launchUrl(subscription.billingPortalUrl!)}
					>
						{'Visit billing portal'}
					</Button>
				)}
			</Box>
			<Box flex='0 0 auto' textAlign='right'>
				{trial ? (
					<React.Fragment>
						<Box fontSize='10px' fontWeight='700' textTransform='uppercase' letterSpacing='0.06em' color='fg.subtle'>
							{'Trial ends'}
						</Box>
						<Box fontSize='sm' color='fg.default' fontWeight='500'>
							{formatDistance(new Date(subscription.endDate!), new Date(), { addSuffix: true })}
						</Box>
					</React.Fragment>
				) : (
					<React.Fragment>
						<Box fontSize='lg' fontWeight='700' color='fg.default'>{'$25.00'}</Box>
						<Box fontSize='xs' color='fg.muted'>{'/ year'}</Box>
					</React.Fragment>
				)}
			</Box>
		</MotionFlex>
	);
};

export default SubscriptionInformation;
