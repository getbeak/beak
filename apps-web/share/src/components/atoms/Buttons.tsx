import { Box, type BoxProps } from '@chakra-ui/react';
import * as React from 'react';

interface CtaButtonProps extends Omit<BoxProps, 'as'> {
	$style: 'primary' | 'secondary' | 'tertiary';
	href?: string;
}

const STYLES = {
	primary: {
		bg: 'accent.pink',
		shadow: 'var(--beak-colors-accent-pink)99',
	},
	secondary: {
		bg: 'bg.surface',
		shadow: 'var(--beak-colors-bg-surface)99',
	},
	tertiary: {
		bg: 'bg.canvas.alt',
		shadow: 'var(--beak-colors-bg-canvas-alt)99',
	},
} as const;

const CtaButton: React.FC<CtaButtonProps> = ({ $style, children, ...rest }) => {
	const s = STYLES[$style];
	return (
		<Box
			as='a'
			display='inline-block'
			borderRadius='md'
			color='fg.onAccent'
			px='2.5'
			py='1.5'
			fontSize='lg'
			cursor='pointer'
			textDecoration='none'
			transition='box-shadow .2s ease'
			bg={s.bg}
			_hover={{ boxShadow: `0 0 20px 2px ${s.shadow}` }}
			{...rest}
		>
			{children}
		</Box>
	);
};

export default CtaButton;
