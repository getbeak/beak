import { chakra } from '@chakra-ui/react';

export const ItemGroup = chakra('div', {
	base: { mb: '5' },
});

export const ItemLabel = chakra('div', {
	base: {
		fontSize: '10px',
		fontWeight: '700',
		color: 'accent.pink',
		letterSpacing: '0.06em',
		textTransform: 'uppercase',
		mb: '2',
	},
});

export const ItemInfo = chakra('div', {
	base: {
		fontSize: 'xs',
		color: 'fg.subtle',
		my: '1.5',
		lineHeight: '1.5',
	},
});

export const ItemSpacer = chakra('div', {
	base: { h: '2' },
});
