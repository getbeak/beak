import { Box, Flex } from '@chakra-ui/react';
import * as React from 'react';

const Header: React.FC = () => (
	<Flex align='center' px='6' py='4' gap='2.5'>
		<Box
			h='56px'
			w='56px'
			bgImage="url('/assets/logo.svg')"
			bgPos='center'
			bgRepeat='no-repeat'
			bgSize='34px'
			borderRadius='lg'
			bg='color-mix(in srgb, var(--beak-colors-accent-pink) 12%, transparent)'
			borderWidth='1px'
			borderColor='color-mix(in srgb, var(--beak-colors-accent-pink) 26%, transparent)'
			style={{
				boxShadow: '0 6px 18px color-mix(in srgb, var(--beak-colors-accent-pink) 22%, transparent), inset 0 1px 0 color-mix(in srgb, white 18%, transparent)',
				backgroundImage: "url('/assets/logo.svg'), radial-gradient(circle at center, color-mix(in srgb, var(--beak-colors-accent-pink) 18%, transparent), transparent 80%)",
			}}
		/>
		<Box>
			<Box
				fontSize='10px'
				fontWeight='700'
				letterSpacing='0.08em'
				textTransform='uppercase'
				color='accent.pink'
				mb='0.5'
			>
				{'Shared with you'}
			</Box>
			<Box fontWeight='600' fontSize='2xl' lineHeight='1.1' color='fg.default'>
				{'Beak'}
			</Box>
		</Box>
	</Flex>
);

export default Header;
