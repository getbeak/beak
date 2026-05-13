import { chakra } from '@chakra-ui/react';

const Label = chakra('label', {
	base: {
		display: 'block',
		mb: '1',
		fontSize: '10px',
		fontWeight: '700',
		color: 'fg.subtle',
		letterSpacing: '0.06em',
		textTransform: 'uppercase',
	},
});

export default Label;
