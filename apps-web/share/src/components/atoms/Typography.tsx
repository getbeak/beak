import { chakra } from '@chakra-ui/react';

export const Title = chakra('div', {
	base: {
		fontSize: '30px',
		fontWeight: '700',
		letterSpacing: '-0.02em',
		lineHeight: '1.1',
		color: 'fg.default',
	},
});

export const TitleSubtle = chakra('div', {
	base: {
		fontSize: '2xl',
		fontWeight: '600',
		letterSpacing: '-0.01em',
		lineHeight: '1.2',
		color: 'fg.muted',
	},
});

export const SubTitle = chakra('div', {
	base: {
		fontSize: 'xl',
		mt: '1.5',
		lineHeight: '1.5',
		color: 'fg.muted',
	},
});

export const BodyRegular = chakra('div', {
	base: {
		color: 'fg.default',
	},
});

export const BodyBold = chakra('div', {
	base: {
		fontWeight: 'semibold',
		color: 'fg.default',
	},
});
