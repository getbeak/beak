import { chakra } from '@chakra-ui/react';

export const Wrapper = chakra('div', {
	base: {
		position: 'relative',
		textAlign: 'center',
		h: '100%',
		bg: 'bg.canvas',
		px: '6',
		py: '8',
		overflow: 'hidden',
	},
});

export const Header = chakra('h1', {
	base: {
		m: '0',
		mt: '3',
		fontWeight: '700',
		fontSize: 'xl',
		lineHeight: '1.1',
		letterSpacing: '-0.02em',
		color: 'fg.default',
	},
});

export const Body = chakra('p', {
	base: {
		mt: '1.5',
		mb: '4',
		fontSize: 'sm',
		lineHeight: '1.5',
		color: 'fg.muted',
		maxW: '420px',
		mx: 'auto',
	},
});
