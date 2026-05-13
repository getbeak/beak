import { chakra } from '@chakra-ui/react';

const FormError = chakra('div', {
	base: {
		py: '1.5',
		color: 'accent.alert',
		fontSize: 'sm',
	},
});

export default FormError;
