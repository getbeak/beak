import { Box, type BoxProps, chakra } from '@chakra-ui/react';
import * as React from 'react';

export const ItemGroup = chakra('div', {
	base: { mb: '5' },
});

export const ItemLabel = chakra('div', {
	base: {
		fontSize: '10px',
		fontWeight: '700',
		color: 'fg.subtle',
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
	},
});

export const ItemSpacer = chakra('div', {
	base: { h: '2' },
});

export const SubItemGroup = chakra('div', {
	base: {
		display: 'flex',
		flexDirection: 'column',
		gap: '2.5',
		fontSize: 'sm',
	},
});

export const SubItem = chakra('div', {
	base: {
		fontSize: 'sm',
		color: 'fg.muted',
	},
});

interface SubItemLabelProps extends BoxProps {
	$abbr?: boolean;
}

export const SubItemLabel: React.FC<SubItemLabelProps> = ({ $abbr, children, ...rest }) => (
	<Box
		mb='1'
		fontSize='xs'
		color='fg.default'
		textDecoration={$abbr ? 'underline' : undefined}
		textDecorationStyle={$abbr ? 'dotted' : undefined}
		{...rest}
	>
		{children}
	</Box>
);
