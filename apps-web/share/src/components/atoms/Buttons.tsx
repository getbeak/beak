import { Box, type BoxProps, chakra } from '@chakra-ui/react';
import * as React from 'react';

interface CtaButtonProps extends Omit<BoxProps, 'as'> {
	tone: 'primary' | 'secondary' | 'tertiary';
	href?: string;
}

// Chakra's `Box` polymorphism can't simultaneously type-accept `as='a' + href`
// and `as='button' + type` without one side erroring; using the `chakra.a` /
// `chakra.button` factories above keeps each branch correctly typed.
const ChakraButton = chakra('button');
const ChakraAnchor = chakra('a');

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
	const shared: BoxProps = {
		display: 'inline-block',
		borderWidth: '0',
		borderRadius: 'md',
		color: 'fg.onAccent',
		px: '3.5',
		py: '2',
		fontSize: 'md',
		fontWeight: '600',
		letterSpacing: '0.01em',
		cursor: 'pointer',
		textDecoration: 'none',
		transition: 'box-shadow .2s ease, transform .12s cubic-bezier(.4,0,.2,1), filter .14s ease',
		bg: s.bg,
		style: {
			boxShadow: `0 6px 18px ${s.halo}, inset 0 1px 0 color-mix(in srgb, white 22%, transparent)`,
		},
		_hover: {
			filter: 'brightness(1.06)',
			transform: 'translateY(-1px)',
			boxShadow: `0 10px 26px ${s.haloHover}, inset 0 1px 0 color-mix(in srgb, white 26%, transparent)`,
		},
		_active: { transform: 'translateY(0) scale(0.97)' },
		_focusVisible: {
			outline: 'none',
			boxShadow: `0 0 0 3px ${s.haloHover}, 0 6px 18px ${s.halo}, inset 0 1px 0 color-mix(in srgb, white 22%, transparent)`,
		},
		...rest,
	};
	if (href !== void 0) {
		// BoxProps carries HTMLDivElement event types; the anchor/button
		// branches accept slightly different event handler shapes, so cast
		// the shared prop bag to `unknown` to dodge the variance check.
		return (
			<ChakraAnchor href={href} {...(shared as unknown as Record<string, unknown>)}>
				{children}
			</ChakraAnchor>
		);
	}
	return (
		<ChakraButton type='button' {...(shared as unknown as Record<string, unknown>)}>
			{children}
		</ChakraButton>
	);
};

export default CtaButton;
