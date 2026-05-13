import { Box, type BoxProps, chakra } from '@chakra-ui/react';
import type { ThemeMode } from '@beak/common/types/theme';
import { motion } from 'framer-motion';
import * as React from 'react';

export const SelectContainer = chakra('div', {
	base: {
		display: 'inline-flex',
		gap: '6',
		px: '5',
		pt: '4',
		pb: '3',
		borderRadius: 'xl',
		borderWidth: '1px',
		borderColor: 'border.subtle',
		bg: 'color-mix(in srgb, var(--beak-colors-bg-surface) 60%, transparent)',
		boxShadow: 'inset 0 1px 0 color-mix(in srgb, white 12%, transparent)',
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
		color={$active ? 'accent.pink' : 'fg.muted'}
		fontWeight={$active ? '600' : '500'}
		fontSize='sm'
		cursor='pointer'
		transition='color .14s ease, transform .08s ease'
		_hover={{ color: $active ? 'accent.pink' : 'fg.default' }}
		_active={{ transform: 'scale(0.97)' }}
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
	<Box position='relative' mb='2' {...rest}>
		{$active && (
			<Box
				position='absolute'
				inset='-4px'
				borderRadius='10px'
				border='2px solid'
				borderColor='accent.pink'
				pointerEvents='none'
				boxShadow='0 0 16px color-mix(in srgb, var(--beak-colors-accent-pink) 45%, transparent)'
			/>
		)}
		<motion.div
			whileHover={{ scale: 1.03 }}
			transition={{ duration: 0.14 }}
			style={{
				width: 90,
				height: 56,
				borderRadius: 6,
				border: '1px solid var(--beak-colors-border-subtle)',
				boxShadow: '0 4px 14px rgba(0,0,0,0.25)',
				backgroundImage: `url('images/${$themeType === 'editor' ? 'editor-' : ''}theme-switcher/${$themeMode}.jpg')`,
				backgroundPosition: 'center',
				backgroundSize: 'cover',
				backgroundRepeat: 'no-repeat',
			}}
		/>
	</Box>
);
