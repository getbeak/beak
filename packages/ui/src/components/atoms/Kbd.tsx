import { chakra } from '@chakra-ui/react';

const Kbd = chakra('kbd', {
	base: {
		display: 'inline-block',
		borderStyle: 'solid',
		borderWidth: '1px',
		borderRadius: 'sm',
		verticalAlign: 'middle',
		px: '1.5',
		py: '0.5',
		mx: '0.5',
		fontFamily: 'body',
		fontSize: '9px',
		lineHeight: '8px',
		color: 'fg.default',
		bg: 'bg.surface.emphasized',
		borderColor: 'border.default',
		boxShadow: 'rgb(0 0 0 / 16%) 0px -1px 0px inset',
		_first: { ml: '0' },
	},
});

export default Kbd;
