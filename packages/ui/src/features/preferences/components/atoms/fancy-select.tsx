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
		borderRadius: 'lg',
		borderWidth: '1px',
		borderColor: 'border.subtle',
		bg: 'color-mix(in srgb, var(--beak-colors-bg-surface) 60%, transparent)',
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
		color={$active ? 'fg.default' : 'fg.muted'}
		opacity={$active ? 1 : 0.7}
		fontSize='sm'
		cursor='pointer'
		transition='opacity .14s ease, color .14s ease, transform .08s ease'
		_hover={{ opacity: 1, color: 'fg.default' }}
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
			<motion.div
				layoutId='preferences-active-theme-ring'
				transition={{ type: 'spring', stiffness: 600, damping: 30 }}
				style={{
					position: 'absolute',
					inset: -3,
					borderRadius: 10,
					border: '2px solid var(--beak-colors-accent-pink)',
					pointerEvents: 'none',
				}}
			/>
		)}
		<motion.div
			whileHover={{ scale: 1.02 }}
			transition={{ duration: 0.14 }}
			style={{
				width: 90,
				height: 56,
				borderRadius: 6,
				border: '1px solid var(--beak-colors-border-subtle)',
				boxShadow: '0 2px 12px rgba(0,0,0,0.25)',
				backgroundImage: `url('images/${$themeType === 'editor' ? 'editor-' : ''}theme-switcher/${$themeMode}.jpg')`,
				backgroundPosition: 'center',
				backgroundSize: 'cover',
				backgroundRepeat: 'no-repeat',
			}}
		/>
	</Box>
);
