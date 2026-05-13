import { Box, type BoxProps, chakra } from '@chakra-ui/react';
import * as React from 'react';

export const FormGroup: React.FC<BoxProps> = ({ children, ...rest }) => (
	<Box
		mb='3'
		css={{
			'> div > article': {
				fontSize: '13px',
				padding: '5px 8px',
				borderRadius: '5px',
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
		mb: '1.5',
		fontSize: '10px',
		fontWeight: '700',
		color: 'fg.subtle',
		letterSpacing: '0.06em',
		textTransform: 'uppercase',
	},
});
