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
		fontWeight: '500',
		fontSize: '2xl',
		lineHeight: '1.2',
		color: 'fg.default',
	},
});

export const Body = chakra('p', {
	base: {
		mt: '2',
		mb: '4',
		fontSize: 'sm',
		color: 'fg.muted',
	},
});
