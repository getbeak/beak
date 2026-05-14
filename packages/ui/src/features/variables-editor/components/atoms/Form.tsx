import { Box, type BoxProps } from '@chakra-ui/react';
import * as React from 'react';

export { default as Label } from '@beak/ui/components/atoms/Label';

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
