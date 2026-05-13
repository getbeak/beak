import { Box, Flex } from '@chakra-ui/react';
import Button from '@beak/ui/components/atoms/Button';
import { ipcExplorerService } from '@beak/ui/lib/ipc';
import { CreditCard } from 'lucide-react';
import * as React from 'react';

const NoActiveSubscription: React.FC = () => (
	<Flex
		direction='column'
		align='center'
		gap='2'
		py='6'
		px='4'
		borderRadius='lg'
		borderWidth='1px'
		borderColor='border.subtle'
		bg='color-mix(in srgb, var(--beak-colors-bg-surface) 50%, transparent)'
		color='fg.muted'
		textAlign='center'
	>
		<Box opacity={0.5} color='accent.pink'>
			<CreditCard size={32} />
		</Box>
		<Box fontSize='sm' fontWeight='600' color='fg.default'>
			{'No active subscription'}
		</Box>
		<Box fontSize='xs' opacity={0.8} mb='1'>
			{'Pick up a Beak subscription to unlock the full feature set.'}
		</Box>
		<Button size='sm' onClick={() => ipcExplorerService.launchUrl('https://getbeak.app')}>
			{'Visit getbeak.app'}
		</Button>
	</Flex>
);

export default NoActiveSubscription;
