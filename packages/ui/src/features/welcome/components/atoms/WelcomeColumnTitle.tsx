import { Heading, type HeadingProps } from '@chakra-ui/react';
import * as React from 'react';

const WelcomeColumnTitle: React.FC<React.PropsWithChildren<HeadingProps>> = ({ children, ...rest }) => (
	<Heading as='h1' fontSize='xl' fontWeight='300' color='fg.default' {...rest}>
		{children}
	</Heading>
);

export default WelcomeColumnTitle;
