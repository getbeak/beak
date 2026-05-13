import { chakra } from '@chakra-ui/react';

const Kbd = chakra('kbd', {
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
		color: 'fg.muted',
		bg: 'color-mix(in srgb, var(--beak-colors-bg-surface) 60%, var(--beak-colors-bg-surface-alt))',
		borderColor: 'border.subtle',
		boxShadow: '0 1px 0 color-mix(in srgb, var(--beak-colors-gray-950) 12%, transparent), inset 0 1px 0 color-mix(in srgb, white 18%, transparent)',
		_first: { ml: '0' },
	},
});

export default Kbd;
