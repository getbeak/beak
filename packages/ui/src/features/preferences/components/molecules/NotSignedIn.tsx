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
		<Flex
			align='center'
			justify='center'
			w='52px'
			h='52px'
			borderRadius='full'
			bg='color-mix(in srgb, var(--beak-colors-accent-pink) 14%, transparent)'
			borderWidth='1px'
			borderColor='color-mix(in srgb, var(--beak-colors-accent-pink) 28%, transparent)'
			color='accent.pink'
			boxShadow='0 6px 18px color-mix(in srgb, var(--beak-colors-accent-pink) 22%, transparent), inset 0 1px 0 color-mix(in srgb, white 18%, transparent)'
		>
			<UserRound size={22} strokeWidth={1.8} />
		</Flex>
		<Box fontSize='sm' fontWeight='600' color='fg.default'>
			{'Not signed in'}
		</Box>
		<Box fontSize='xs' color='fg.subtle' lineHeight='1.5' maxW='280px'>
			{'Sign in to your account to view your subscription plan.'}
		</Box>
	</Flex>
);

export default NotSignedIn;
