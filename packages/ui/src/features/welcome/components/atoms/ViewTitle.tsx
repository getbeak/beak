import { Heading, type HeadingProps } from '@chakra-ui/react';
import * as React from 'react';

const ViewTitle: React.FC<React.PropsWithChildren<HeadingProps>> = ({ children, ...rest }) => (
	<Heading
		as='h1'
		mt='0'
		mb='1'
		fontSize='3xl'
		fontWeight='300'
		letterSpacing='-0.01em'
		color='fg.default'
		{...rest}
	>
		{children}
	</Heading>
);

export default ViewTitle;
