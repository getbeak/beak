import { Box, Flex } from '@chakra-ui/react';
import * as React from 'react';

const Header: React.FC = () => (
	<Flex align='center' px='6' py='4'>
		<Box
			h='60px'
			w='60px'
			bgImage="url('/assets/logo.svg')"
			bgPos='center'
			bgRepeat='no-repeat'
			bgSize='40px'
		/>
		<Box textTransform='uppercase' fontWeight='semibold' fontSize='2xl' lineHeight='24px' ml='2.5'>
			{'Beak'}
		</Box>
	</Flex>
);

export default Header;
