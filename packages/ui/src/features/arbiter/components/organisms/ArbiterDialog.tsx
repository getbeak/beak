import { Box, Flex } from '@chakra-ui/react';
import Button from '@beak/ui/components/atoms/Button';
import Dialog from '@beak/ui/components/molecules/Dialog';
import { AlertTriangle } from 'lucide-react';
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
		<Dialog onClose={onClose} tone='alert'>
			<Box w='520px' p='5'>
				<Flex align='center' gap='2.5' mb='3'>
					<Flex
						align='center'
						justify='center'
						w='32px'
						h='32px'
						borderRadius='full'
						bg='color-mix(in srgb, var(--beak-colors-accent-warning) 14%, transparent)'
						borderWidth='1px'
						borderColor='color-mix(in srgb, var(--beak-colors-accent-warning) 28%, transparent)'
						color='accent.warning'
						boxShadow='0 4px 12px color-mix(in srgb, var(--beak-colors-accent-warning) 22%, transparent), inset 0 1px 0 color-mix(in srgb, white 16%, transparent)'
					>
						<AlertTriangle size={14} strokeWidth={2} />
					</Flex>
					<Box fontSize='md' fontWeight='600' color='fg.default' letterSpacing='-0.005em'>
						{'Subscription check failed'}
					</Box>
				</Flex>

				<Box as='p' fontSize='sm' color='fg.muted' lineHeight='1.55' mb='3'>
					{'Beak can\'t reach our subscription service right now. To stay safe, '}
					{'you\'ll be signed out '}
					<Box as='strong' color='fg.default' fontWeight='600'>{friendlyLockNotice}</Box>
					{'. If your subscription is active, getting back online before then will keep '}
					{'everything working.'}
				</Box>

				<Box
					p='2.5'
					borderRadius='md'
					borderWidth='1px'
					borderColor='border.subtle'
					bg='color-mix(in srgb, var(--beak-colors-bg-surface) 60%, transparent)'
					mb='4'
				>
					<Box fontSize='10px' fontWeight='700' letterSpacing='0.06em' textTransform='uppercase' color='fg.subtle' mb='1'>
						{'Last successful check'}
					</Box>
					<Box fontSize='xs' fontFamily='mono' color='fg.default'>
						{lastSuccessfulCheck.toString()}
					</Box>
				</Box>

				<Flex justify='flex-end' gap='2'>
					<Button colour='secondary' size='sm' onClick={onClose}>{'Dismiss'}</Button>
					<Button size='sm' onClick={() => { /* disabled */ }}>{'Check again'}</Button>
				</Flex>
			</Box>
		</Dialog>
	);
};

export default ArbiterDialog;
