import { useIsKeyHeld } from '@beak/ui/contexts/keyboard-state-context';
import { chakra } from '@chakra-ui/react';
import * as React from 'react';

const StyledKbd = chakra('kbd', {
	base: {
		display: 'inline-flex',
		alignItems: 'center',
		justifyContent: 'center',
		minW: '18px',
		h: '18px',
		px: '1.5',
		mx: '0.5',
		borderStyle: 'solid',
		borderWidth: '1px',
		borderRadius: '4px',
		verticalAlign: 'middle',
		fontFamily: 'mono',
		fontSize: '10px',
		fontWeight: '600',
		lineHeight: '1',
		letterSpacing: '0.02em',
		fontVariantNumeric: 'tabular-nums',
		color: 'fg.muted',
		bg: 'color-mix(in srgb, var(--beak-colors-bg-surface) 60%, var(--beak-colors-bg-surface-alt))',
		borderColor: 'border.subtle',
		boxShadow:
			'0 1px 0 color-mix(in srgb, var(--beak-colors-gray-950) 12%, transparent), inset 0 1px 0 color-mix(in srgb, white 18%, transparent)',
		transition:
			'transform .06s ease-out, box-shadow .06s ease-out, background-color .06s ease-out, color .06s ease-out, border-color .06s ease-out',
		_first: { ml: '0' },
		'&[data-pressed="true"]': {
			transform: 'translateY(1px)',
			color: 'var(--beak-colors-accent-pink)',
			bg: 'color-mix(in srgb, var(--beak-colors-accent-pink) 18%, var(--beak-colors-bg-surface-alt))',
			borderColor: 'color-mix(in srgb, var(--beak-colors-accent-pink) 45%, transparent)',
			boxShadow: 'inset 0 1px 2px color-mix(in srgb, var(--beak-colors-gray-950) 22%, transparent)',
		},
	},
});

interface KbdProps extends React.ComponentProps<typeof StyledKbd> {
	children: React.ReactNode;
}

const Kbd: React.FC<KbdProps> = ({ children, ...rest }) => {
	const label = typeof children === 'string' ? children : '';
	const held = useIsKeyHeld(label);
	return (
		<StyledKbd data-pressed={held || undefined} {...rest}>
			{children}
		</StyledKbd>
	);
};

export default Kbd;
