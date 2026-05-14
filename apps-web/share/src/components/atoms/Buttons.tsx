import { Box, type BoxProps } from '@chakra-ui/react';
import * as React from 'react';

interface CtaButtonProps extends Omit<BoxProps, 'as'> {
	tone: 'primary' | 'secondary' | 'tertiary';
	href?: string;
}

const STYLES = {
	primary: {
		bg: 'accent.pink',
		halo: 'color-mix(in srgb, var(--beak-colors-accent-pink) 40%, transparent)',
		haloHover: 'color-mix(in srgb, var(--beak-colors-accent-pink) 55%, transparent)',
	},
	secondary: {
		bg: 'bg.surface',
		halo: 'color-mix(in srgb, var(--beak-colors-fg-default) 15%, transparent)',
		haloHover: 'color-mix(in srgb, var(--beak-colors-fg-default) 25%, transparent)',
	},
	tertiary: {
		bg: 'bg.canvas.alt',
		halo: 'color-mix(in srgb, var(--beak-colors-fg-default) 10%, transparent)',
		haloHover: 'color-mix(in srgb, var(--beak-colors-fg-default) 18%, transparent)',
	},
} as const;

const CtaButton: React.FC<CtaButtonProps> = ({ tone, children, href, ...rest }) => {
	const s = STYLES[tone];
	return (
		<Box
			as={href ? 'a' : 'button'}
			type={href ? undefined : 'button'}
			href={href}
			display='inline-block'
			borderWidth='0'
			borderRadius='md'
			color='fg.onAccent'
			px='3.5'
			py='2'
			fontSize='md'
			fontWeight='600'
			letterSpacing='0.01em'
			cursor='pointer'
			textDecoration='none'
			transition='box-shadow .2s ease, transform .12s cubic-bezier(.4,0,.2,1), filter .14s ease'
			bg={s.bg}
			style={{
				boxShadow: `0 6px 18px ${s.halo}, inset 0 1px 0 color-mix(in srgb, white 22%, transparent)`,
			}}
			_hover={{
				filter: 'brightness(1.06)',
				transform: 'translateY(-1px)',
				boxShadow: `0 10px 26px ${s.haloHover}, inset 0 1px 0 color-mix(in srgb, white 26%, transparent)`,
			}}
			_active={{ transform: 'translateY(0) scale(0.97)' }}
			_focusVisible={{
				outline: 'none',
				boxShadow: `0 0 0 3px ${s.haloHover}, 0 6px 18px ${s.halo}, inset 0 1px 0 color-mix(in srgb, white 22%, transparent)`,
			}}
			{...rest}
		>
			{children}
		</Box>
	);
};

export default CtaButton;
