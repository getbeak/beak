import { chakra } from '@chakra-ui/react';

export const Wrapper = chakra('div', {
	base: {
		textAlign: 'center',
		h: '100%',
		bg: 'bg.canvas',
		px: '6',
		py: '5',
	},
});

export const Header = chakra('h1', {
	base: {
		m: '0',
		fontWeight: '400',
		fontSize: '3xl',
		lineHeight: '25px',
		color: 'fg.default',
	},
});

export const Body = chakra('p', {
	base: {
		fontSize: 'lg',
		color: 'fg.muted',
	},
});
