import { chakra } from '@chakra-ui/react';

const FormInput = chakra('div', {
	base: {
		py: '2',
		display: 'flex',
		flexDirection: 'column',
		gap: '1',
	},
});

export default FormInput;
