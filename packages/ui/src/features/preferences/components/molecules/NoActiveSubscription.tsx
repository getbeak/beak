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
		borderColor='color-mix(in srgb, var(--beak-colors-accent-pink) 14%, var(--beak-colors-border-subtle))'
		bg='color-mix(in srgb, var(--beak-colors-bg-surface) 50%, transparent)'
		color='fg.muted'
		textAlign='center'
	>
		<Flex
			align='center'
			justify='center'
			w='52px'
			h='52px'
			borderRadius='full'
			bg='color-mix(in srgb, var(--beak-colors-accent-pink) 16%, transparent)'
			borderWidth='1px'
			borderColor='color-mix(in srgb, var(--beak-colors-accent-pink) 30%, transparent)'
			color='accent.pink'
			boxShadow='0 6px 18px color-mix(in srgb, var(--beak-colors-accent-pink) 25%, transparent), inset 0 1px 0 color-mix(in srgb, white 18%, transparent)'
		>
			<CreditCard size={22} strokeWidth={1.8} />
		</Flex>
		<Box fontSize='sm' fontWeight='600' color='fg.default'>
			{'No active subscription'}
		</Box>
		<Box fontSize='xs' color='fg.subtle' lineHeight='1.5' maxW='280px' mb='1'>
			{'Pick up a Beak subscription to unlock the full feature set.'}
		</Box>
		<Button size='sm' onClick={() => ipcExplorerService.launchUrl('https://getbeak.app')}>
			{'Visit getbeak.app'}
		</Button>
	</Flex>
);

export default NoActiveSubscription;
