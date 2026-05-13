import { Box, type BoxProps, chakra } from '@chakra-ui/react';
import type { ThemeMode } from '@beak/common/types/theme';
import * as React from 'react';

export const SelectContainer = chakra('div', {
	base: {
		display: 'inline-flex',
		gap: '9',
		px: '6',
		pt: '5',
		pb: '4',
		borderRadius: 'lg',
		bg: 'bg.surface.alt',
	},
});

interface SelectItemProps extends BoxProps {
	$active?: boolean;
}

export const SelectItem: React.FC<SelectItemProps> = ({ $active, children, ...rest }) => (
	<Box
		display='flex'
		flexDirection='column'
		alignItems='center'
		color='fg.muted'
		opacity={$active ? 1 : 0.6}
		fontSize='lg'
		cursor='pointer'
		{...rest}
	>
		{children}
	</Box>
);

interface SelectItemPreviewProps extends BoxProps {
	$active?: boolean;
	$themeMode: ThemeMode;
	$themeType?: 'general' | 'editor';
}

export const SelectItemPreview: React.FC<SelectItemPreviewProps> = ({
	$active,
	$themeMode,
	$themeType,
	...rest
}) => (
	<Box
		w='90px'
		h='56px'
		borderRadius='md'
		bg='pink'
		mb='2.5'
		borderWidth='2px'
		borderColor={$active ? 'accent.pink' : 'transparent'}
		bgImage={`url('images/${$themeType === 'editor' ? 'editor-' : ''}theme-switcher/${$themeMode}.jpg')`}
		bgPos='center'
		bgSize='cover'
		bgRepeat='no-repeat'
		{...rest}
	/>
);
