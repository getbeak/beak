import { Box, type BoxProps } from '@chakra-ui/react';
import React from 'react';

export const Title: React.FC<BoxProps> = props => (
	<Box fontSize='40px' fontWeight={700} color='textOnSurfaceBackground' {...props} />
);

export const TitleSubtle: React.FC<BoxProps> = props => (
	<Box fontSize='20px' lineHeight='24px' fontWeight={700} color='textMinor' {...props} />
);

export const SubTitle: React.FC<BoxProps> = props => <Box fontSize='16px' mt='10px' color='textMinor' {...props} />;

export const BodyRegular: React.FC<BoxProps> = props => <Box color='textOnSurfaceBackground' {...props} />;

export const BodyBold: React.FC<BoxProps> = props => (
	<Box fontWeight={600} color='textOnSurfaceBackground' {...props} />
);
