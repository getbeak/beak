import { Box, Flex } from '@chakra-ui/react';
import { UserRound } from 'lucide-react';
import * as React from 'react';

const NotSignedIn: React.FC = () => (
	<Flex
		direction='column'
		align='center'
		gap='2'
		py='8'
		px='4'
		borderRadius='lg'
		borderWidth='1px'
		borderColor='border.subtle'
		bg='color-mix(in srgb, var(--beak-colors-bg-surface) 50%, transparent)'
		color='fg.muted'
		textAlign='center'
	>
		<Box opacity={0.45} color='accent.pink'>
			<UserRound size={32} />
		</Box>
		<Box fontSize='sm' fontWeight='600' color='fg.default'>
			{'Not signed in'}
		</Box>
		<Box fontSize='xs' opacity={0.8}>
			{'Sign in to your account to view your subscription plan.'}
		</Box>
	</Flex>
);

export default NotSignedIn;
