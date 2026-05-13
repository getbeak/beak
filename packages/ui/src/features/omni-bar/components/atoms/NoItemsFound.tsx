import { Box, Flex } from '@chakra-ui/react';
import { SearchX } from 'lucide-react';
import * as React from 'react';

const NoItemsFound: React.FC<React.PropsWithChildren> = ({ children }) => (
	<Flex direction='column' align='center' justify='center' gap='2' py='8' color='fg.subtle'>
		<Box opacity={0.4}>
			<SearchX size={28} />
		</Box>
		<Box fontSize='sm' color='fg.muted'>
			{children}
		</Box>
		<Box fontSize='xs' opacity={0.7}>
			{'Try a different query'}
		</Box>
	</Flex>
);

export default NoItemsFound;
