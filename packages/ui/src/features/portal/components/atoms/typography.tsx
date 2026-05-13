import { Box, type BoxProps, chakra } from '@chakra-ui/react';
import * as React from 'react';

export const SubTitle = chakra('p', {
	base: {
		textAlign: 'center',
		fontSize: 'lg',
		color: 'fg.muted',
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
		my='2.5'
		h='150px'
		maxW='250px'
		style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
		css={{ '> button': { marginTop: '10px', width: '100%' } }}
		{...rest}
	>
		{children}
	</Box>
);

export const Error = chakra('div', {
	base: {
		py: '1.5',
		color: 'accent.alert',
		fontSize: 'sm',
	},
});
