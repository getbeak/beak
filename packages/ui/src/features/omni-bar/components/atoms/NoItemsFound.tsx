import { Box, Flex } from '@chakra-ui/react';
import { SearchX } from 'lucide-react';
import * as React from 'react';

const NoItemsFound: React.FC<React.PropsWithChildren> = ({ children }) => (
	<Flex direction='column' align='center' justify='center' gap='2.5' py='8' color='fg.subtle'>
		<Flex
			align='center'
			justify='center'
			w='44px'
			h='44px'
			borderRadius='full'
			bg='color-mix(in srgb, var(--beak-colors-fg-subtle) 12%, transparent)'
			color='fg.subtle'
		>
			<SearchX size={20} strokeWidth={1.8} />
		</Flex>
		<Box fontSize='sm' fontWeight='600' color='fg.default'>
			{children}
		</Box>
		<Box fontSize='10px' color='fg.subtle' fontWeight='700' letterSpacing='0.06em' textTransform='uppercase'>
			{'Try a different query'}
		</Box>
	</Flex>
);

export default NoItemsFound;
