import { chakra } from '@chakra-ui/react';

export const Title = chakra('div', {
	base: {
		fontSize: '30px',
		fontWeight: 'bold',
		color: 'fg.default',
	},
});

export const TitleSubtle = chakra('div', {
	base: {
		fontSize: '2xl',
		fontWeight: 'bold',
		lineHeight: '24px',
		color: 'fg.muted',
	},
});

export const SubTitle = chakra('div', {
	base: {
		fontSize: 'xl',
		mt: '1.5',
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
