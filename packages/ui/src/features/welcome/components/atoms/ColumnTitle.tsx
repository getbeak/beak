import { Heading, type HeadingProps } from '@chakra-ui/react';
import * as React from 'react';

const ColumnTitle: React.FC<React.PropsWithChildren<HeadingProps>> = ({ children, ...rest }) => (
	<Heading
		as='h2'
		fontSize='xl'
		fontWeight='300'
		mt='5'
		mb='3'
		color='fg.default'
		_first={{ mt: '0' }}
		{...rest}
	>
		{children}
	</Heading>
);

export default ColumnTitle;
