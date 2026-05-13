import { Box, type BoxProps } from '@chakra-ui/react';
import * as React from 'react';

const WarningLabel: React.FC<BoxProps> = ({ children, ...rest }) => (
	<Box
		bg='#f9ba40'
		cursor='pointer'
		px='1'
		py='0.5'
		fontSize='11px'
		borderRadius='md'
		borderWidth='2px'
		borderColor='#f9ba40e6'
		zIndex={101}
		animation='beakWarningPulse 8s infinite'
		css={{
			'@keyframes beakWarningPulse': {
				'0%': { backgroundColor: '#f9ba40d3' },
				'50%': { backgroundColor: '#e09e3aaa' },
				'100%': { backgroundColor: '#f9ba40d8' },
			},
		}}
		{...rest}
	>
		{children}
	</Box>
);

export default WarningLabel;
