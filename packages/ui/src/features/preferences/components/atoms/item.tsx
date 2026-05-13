import { Box, type BoxProps, chakra } from '@chakra-ui/react';
import * as React from 'react';

export const ItemGroup = chakra('div', {
	base: { mb: '5' },
});

export const ItemLabel = chakra('div', {
	base: {
		fontSize: 'lg',
		fontWeight: 'semibold',
		color: 'fg.muted',
		mb: '2.5',
	},
});

export const ItemInfo = chakra('div', {
	base: {
		fontSize: 'sm',
		color: 'fg.subtle',
		my: '1.5',
	},
});

export const ItemSpacer = chakra('div', {
	base: { h: '1.5' },
});

export const SubItemGroup = chakra('div', {
	base: {
		display: 'flex',
		flexDirection: 'column',
		gap: '2',
		fontSize: 'lg',
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
		textDecoration={$abbr ? 'underline' : undefined}
		textDecorationStyle={$abbr ? 'dotted' : undefined}
		{...rest}
	>
		{children}
	</Box>
);
