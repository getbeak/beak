import { Box, type BoxProps } from '@chakra-ui/react';
import * as React from 'react';

interface RowProps extends BoxProps {
	$cols: number;
}

export const Row: React.FC<RowProps> = ({ $cols, children, ...rest }) => (
	<Box
		display='grid'
		gridTemplateColumns={`minmax(120px, .9fr) repeat(${$cols}, minmax(140px, 1fr)) minmax(120px, .9fr)`}
		gridAutoRows='auto'
		{...rest}
	>
		{children}
	</Box>
);

export const Header: React.FC<BoxProps> = ({ children, ...rest }) => (
	<Box
		display='inline-block'
		position='sticky'
		top='0'
		zIndex={10}
		bg='bg.surface'
		minW='100%'
		css={{ '.beak-vs-cell': { backgroundColor: 'var(--beak-colors-bg-surface)' } }}
		{...rest}
	>
		{children}
	</Box>
);

export const HeaderAction: React.FC<BoxProps> = props => (
	<Box display='inline-block' ml='2' {...props} />
);

export const Body: React.FC<BoxProps> = props => <Box zIndex={9} {...props} />;
