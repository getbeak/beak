import { Box, type BoxProps } from '@chakra-ui/react';
import type React from 'react';

export const Container: React.FC<BoxProps> = props => (
	<Box mx='auto' px='25px' w='calc(100% - 50px)' maxW='1200px' {...props} />
);

export const SmallContainer: React.FC<BoxProps> = props => (
	<Box mx='auto' px='25px' w='calc(100% - 50px)' maxW='900px' {...props} />
);

export default Container;
