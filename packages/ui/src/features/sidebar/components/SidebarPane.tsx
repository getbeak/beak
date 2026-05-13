import { Flex } from '@chakra-ui/react';
import * as React from 'react';

const SidebarPane: React.FC<React.PropsWithChildren> = ({ children }) => (
	<Flex direction='column' h='100%' overflowY='hidden'>
		{children}
	</Flex>
);

export default SidebarPane;
