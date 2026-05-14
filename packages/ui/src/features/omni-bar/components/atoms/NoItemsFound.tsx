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
			bg='color-mix(in srgb, var(--beak-colors-fg-subtle) 10%, transparent)'
			borderWidth='1px'
			borderColor='color-mix(in srgb, var(--beak-colors-fg-subtle) 22%, transparent)'
			color='fg.subtle'
			boxShadow='0 4px 12px color-mix(in srgb, var(--beak-colors-fg-subtle) 14%, transparent), inset 0 1px 0 color-mix(in srgb, white 14%, transparent)'
		>
			<SearchX size={20} strokeWidth={1.8} />
		</Flex>
		<Box fontSize='sm' fontWeight='600' color='fg.default' letterSpacing='-0.005em'>
			{children}
		</Box>
		<Box fontSize='10px' color='accent.pink' fontWeight='700' letterSpacing='0.06em' textTransform='uppercase'>
			{'Try a different query'}
		</Box>
	</Flex>
);

export default NoItemsFound;
