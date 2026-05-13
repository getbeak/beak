import { Button as ChakraButton, type ButtonProps as ChakraButtonProps } from '@chakra-ui/react';
import * as React from 'react';

/**
 * Beak's button — Chakra v3 under the hood.
 *
 * Three variants:
 *   - `primary`     — solid accent-pink fill with white text. The CTA.
 *   - `secondary`   — outlined: 1px border, foreground text. Use for
 *                     dismiss / cancel / cancel-equivalent actions.
 *   - `destructive` — solid accent-alert fill with white text.
 *
 * High contrast in both light & dark mode (the primary fills with the
 * brand colour rather than relying on a 2-px outline you have to squint
 * at). Sharper hover (no fill flip; lifts colour instead), 0.96 press
 * scale, brand-glow focus ring.
 */
export interface ButtonProps extends Omit<ChakraButtonProps, 'colorScheme' | 'size'> {
	colour?: 'primary' | 'secondary' | 'destructive';
	size?: 'md' | 'sm';
}

type Tone = NonNullable<ButtonProps['colour']>;

interface ToneSpec {
	bg: string;
	bgHover: string;
	bgActive: string;
	text: string;
	border: string;
	borderHover: string;
	glow: string;
}

const TONES: Record<Tone, ToneSpec> = {
	primary: {
		bg: 'var(--beak-colors-accent-pink)',
		bgHover: 'color-mix(in srgb, var(--beak-colors-accent-pink) 88%, white)',
		bgActive: 'color-mix(in srgb, var(--beak-colors-accent-pink) 92%, black)',
		text: 'var(--beak-colors-fg-onAccent)',
		border: 'var(--beak-colors-accent-pink)',
		borderHover: 'var(--beak-colors-accent-pink)',
		glow: 'var(--beak-colors-accent-pink)',
	},
	secondary: {
		bg: 'transparent',
		bgHover: 'color-mix(in srgb, var(--beak-colors-accent-pink) 10%, transparent)',
		bgActive: 'color-mix(in srgb, var(--beak-colors-accent-pink) 14%, transparent)',
		text: 'var(--beak-colors-fg-default)',
		border: 'var(--beak-colors-border-default)',
		borderHover: 'var(--beak-colors-accent-pink)',
		glow: 'var(--beak-colors-accent-pink)',
	},
	destructive: {
		bg: 'var(--beak-colors-accent-alert)',
		bgHover: 'color-mix(in srgb, var(--beak-colors-accent-alert) 88%, white)',
		bgActive: 'color-mix(in srgb, var(--beak-colors-accent-alert) 92%, black)',
		text: 'var(--beak-colors-fg-onAccent)',
		border: 'var(--beak-colors-accent-alert)',
		borderHover: 'var(--beak-colors-accent-alert)',
		glow: 'var(--beak-colors-accent-alert)',
	},
};

const Button: React.FC<ButtonProps> = ({ colour = 'primary', size = 'md', children, ...rest }) => {
	const tone = TONES[colour];
	const isSm = size === 'sm';

	return (
		<ChakraButton
			borderWidth='1px'
			borderRadius='md'
			px={isSm ? '2.5' : '3.5'}
			py={isSm ? '1' : '1.5'}
			h='auto'
			minH={isSm ? '26px' : '32px'}
			fontSize={isSm ? 'xs' : 'sm'}
			fontWeight='600'
			letterSpacing='0.01em'
			lineHeight='1'
			transitionProperty='transform, background, border-color, box-shadow, color'
			transitionDuration='0.14s'
			transitionTimingFunction='ease'
			style={{
				background: tone.bg,
				color: tone.text,
				borderColor: tone.border,
			}}
			_hover={{
				bg: tone.bgHover,
				borderColor: tone.borderHover,
			}}
			_active={{ transform: 'scale(0.97)', bg: tone.bgActive }}
			_focus={{
				outline: 'none',
				boxShadow: `0 0 0 3px color-mix(in srgb, ${tone.glow} 32%, transparent)`,
			}}
			_focusVisible={{
				outline: 'none',
				boxShadow: `0 0 0 3px color-mix(in srgb, ${tone.glow} 32%, transparent)`,
			}}
			_disabled={{
				opacity: 0.5,
				cursor: 'not-allowed',
				_hover: { bg: tone.bg, borderColor: tone.border },
			}}
			{...rest}
		>
			{children}
		</ChakraButton>
	);
};

export default Button;
