import { Box, type BoxProps } from '@chakra-ui/react';
import type React from 'react';

export const LastUpdated: React.FC<React.PropsWithChildren<BoxProps>> = props => (
	<Box as='p' color='textMinor' {...props} />
);

export const LegalTlDr: React.FC<React.PropsWithChildren<BoxProps>> = props => (
	<Box
		as='p'
		mt='30px'
		fontSize='15px'
		color='textMinor'
		css={{ '&:before': { marginRight: '8px', content: '">"' } }}
		{...props}
	/>
);

export const LegalHeader: React.FC<React.PropsWithChildren<BoxProps>> = props => (
	<Box py={{ base: '40px', md: '80px' }} bg='background' {...props} />
);
