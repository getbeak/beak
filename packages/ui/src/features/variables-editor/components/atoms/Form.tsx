import { Box, type BoxProps, chakra } from '@chakra-ui/react';
import * as React from 'react';

export const FormGroup: React.FC<BoxProps> = ({ children, ...rest }) => (
	<Box
		mb='2'
		css={{
			'> div > article': {
				fontSize: '13px',
				padding: '3px 5px',
				paddingBottom: '4px',
				borderRadius: '3px',
			},
		}}
		{...rest}
	>
		{children}
	</Box>
);

export const Label = chakra('label', {
	base: {
		display: 'block',
		mb: '1',
		fontSize: 'md',
	},
});
