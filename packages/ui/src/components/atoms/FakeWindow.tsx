import { Box, type BoxProps } from '@chakra-ui/react';
import * as React from 'react';

interface FakeWindowProps extends Omit<BoxProps, 'maxWidth' | 'maxHeight' | 'width' | 'height'> {
	$maxWidth?: number;
	$maxHeight?: number;
	$width?: number;
	$height?: number;
}

export const FakeWindow: React.FC<FakeWindowProps> = ({
	$maxWidth,
	$maxHeight,
	$width,
	$height,
	children,
	...rest
}) => (
	<Box
		position='relative'
		borderRadius='xl'
		overflow='hidden'
		maxW={$maxWidth ? `${$maxWidth}px` : undefined}
		maxH={$maxHeight ? `${$maxHeight}px` : undefined}
		w={$width ? `${$width}px` : undefined}
		h={$height ? `${$height}px` : undefined}
		backdropFilter='blur(30px)'
		boxShadow='0 22px 70px 4px rgba(0, 0, 0, 0.56)'
		{...rest}
	>
		{children}
	</Box>
);
