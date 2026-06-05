import { Box } from '@chakra-ui/react';
import React from 'react';

interface ScrollTargetProps {
	target: string;
}

const ScrollTarget: React.FC<ScrollTargetProps> = ({ target }) => (
	<Box position='relative'>
		<Box position='absolute' top='-150px' id={target} />
	</Box>
);

export default ScrollTarget;
