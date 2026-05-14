import { Box, type BoxProps, chakra } from '@chakra-ui/react';
import * as React from 'react';

export const SubTitle = chakra('p', {
	base: {
		textAlign: 'center',
		fontSize: 'sm',
		color: 'fg.muted',
		mt: '0.5',
		mb: '3',
		lineHeight: '1.5',
		maxW: '320px',
		mx: 'auto',
	},
});

/**
 * ActionContainer keeps the previous `> button { width: 100% }` rule so
 * any direct-child buttons stretch full width and pick up the standard
 * Beak vertical spacing. The `-webkit-app-region: no-drag` is set inline
 * so the buttons remain clickable inside Electron's draggable regions.
 */
export const ActionContainer: React.FC<BoxProps> = ({ children, ...rest }) => (
	<Box
		mx='auto'
		my='2'
		maxW='280px'
		display='flex'
		flexDirection='column'
		gap='2'
		style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
		css={{ '> button': { width: '100%' } }}
		{...rest}
	>
		{children}
	</Box>
);
