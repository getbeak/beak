import { Box } from '@chakra-ui/react';
import Button from '@beak/ui/components/atoms/Button';
import Dialog from '@beak/ui/components/molecules/Dialog';
import * as React from 'react';

import useArbiterLocking from '../../hooks/use-arbiter-locking';

export interface ArbiterDialogProps {
	open: boolean;
	onClose: () => void;
}

export const ArbiterDialog: React.FC<ArbiterDialogProps> = ({ open, onClose }) => {
	const { friendlyLockNotice, lastSuccessfulCheck } = useArbiterLocking();

	if (!open) return null;

	return (
		<Dialog onClose={onClose}>
			<Box w='500px' p='4' fontSize='lg'>
				<Box fontSize='2xl' fontWeight='300'>{'Unable to check subscription status'}</Box>
				<Box as='p' fontSize='md' my='1.5' color='fg.muted'>
					{'Beak is currently unable to check the validity of your subscription. '}
					{'Due to this, Beak will sign you out '}
					<strong>{friendlyLockNotice}</strong>
					{'. If you do '}
					{'have an active subscription, check your internet connection before '}
					{'the lock out time to prevent any disruption to your workflow.'}
				</Box>
				<Box as='p' fontSize='md' my='1.5' color='fg.muted'>
					{'The last successful check was on '}
					<strong>{lastSuccessfulCheck.toString()}</strong>
					{'.'}
				</Box>
				<Box mt='2.5'>
					<Button
						size='sm'
						onClick={() => {
							/* This dialog is disabled currently */
						}}
					>
						{'Check again'}
					</Button>
				</Box>
			</Box>
		</Dialog>
	);
};

export default ArbiterDialog;
