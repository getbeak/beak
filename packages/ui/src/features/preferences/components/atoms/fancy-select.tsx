import { Box, type BoxProps, chakra } from '@chakra-ui/react';
import type { ThemeMode } from '@beak/common/types/theme';
import { motion } from 'framer-motion';
import * as React from 'react';

const SelectContainerBase = chakra('div', {
	base: {
		display: 'inline-flex',
		gap: '6',
		px: '5',
		pt: '4',
		pb: '3',
		borderRadius: 'xl',
		borderWidth: '1px',
		borderColor: 'color-mix(in srgb, var(--beak-colors-accent-pink) 16%, var(--beak-colors-border-subtle))',
		bg: 'color-mix(in srgb, var(--beak-colors-bg-surface) 60%, transparent)',
		boxShadow: '0 4px 12px color-mix(in srgb, var(--beak-colors-accent-pink) 10%, rgba(0,0,0,0.04)), inset 0 1px 0 color-mix(in srgb, white 14%, transparent)',
	},
});

export const SelectContainer: React.FC<BoxProps> = props => (
	<SelectContainerBase role='radiogroup' {...props} />
);

interface SelectItemProps extends BoxProps {
	$active?: boolean;
}

export const SelectItem: React.FC<SelectItemProps> = ({ $active, children, onClick, onKeyDown, ...rest }) => (
	<Box
		role='radio'
		aria-checked={$active}
		tabIndex={0}
		display='flex'
		flexDirection='column'
		alignItems='center'
		color={$active ? 'accent.pink' : 'fg.muted'}
		fontWeight={$active ? '600' : '500'}
		fontSize='sm'
		cursor='pointer'
		transition='color .14s ease, transform .08s ease'
		borderRadius='md'
		_hover={{ color: $active ? 'accent.pink' : 'fg.default' }}
		_focusVisible={{
			outline: 'none',
			boxShadow: '0 0 0 2px color-mix(in srgb, var(--beak-colors-accent-pink) 40%, transparent)',
		}}
		_active={{ transform: 'scale(0.97)' }}
		onClick={onClick}
		onKeyDown={(event: React.KeyboardEvent<HTMLDivElement>) => {
			onKeyDown?.(event);
			if (event.defaultPrevented) return;
			if (event.key === 'Enter' || event.key === ' ') {
				event.preventDefault();
				onClick?.(event as unknown as React.MouseEvent<HTMLDivElement>);
			}
		}}
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
				boxShadow: '0 4px 14px rgba(0,0,0,0.25), inset 0 1px 0 color-mix(in srgb, white 14%, transparent)',
				backgroundImage: `url('images/${$themeType === 'editor' ? 'editor-' : ''}theme-switcher/${$themeMode}.jpg')`,
				backgroundPosition: 'center',
				backgroundSize: 'cover',
				backgroundRepeat: 'no-repeat',
			}}
		/>
	</Box>
);
