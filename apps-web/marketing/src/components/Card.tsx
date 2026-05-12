import { Box, type BoxProps, Grid, type GridProps } from '@chakra-ui/react';
import React from 'react';

export const CardGrid: React.FC<GridProps> = props => (
	<Grid templateColumns='repeat(auto-fit, minmax(300px, 1fr))' columnGap='40px' rowGap='30px' {...props} />
);

export const Card: React.FC<BoxProps> = props => (
	<Box
		backdropFilter='blur(10px)'
		borderRadius='25px'
		p='35px'
		bg='surfaceHighlight'
		color='textOnSurfaceBackground'
		{...props}
	/>
);

export const CardIcons: React.FC<BoxProps> = props => <Box mb='10px' {...props} />;

export const CardTitle: React.FC<BoxProps> = props => <Box fontSize='18px' fontWeight={600} {...props} />;

export const CardBody: React.FC<BoxProps> = props => <Box mt='10px' fontSize='16px' color='textMinor' {...props} />;
