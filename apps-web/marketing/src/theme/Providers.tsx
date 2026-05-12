import { ChakraProvider } from '@chakra-ui/react';
import { ThemeProvider } from 'next-themes';
import React from 'react';

import { system } from './index';

export const Providers: React.FC<React.PropsWithChildren> = ({ children }) => (
	<ThemeProvider attribute='class' defaultTheme='system' enableSystem disableTransitionOnChange>
		<ChakraProvider value={system}>{children}</ChakraProvider>
	</ThemeProvider>
);
