import { chakra } from '@chakra-ui/react';

export const Row = chakra('div', {
	base: {
		display: 'grid',
		gridTemplateColumns: 'minmax(0, .9fr) 35px minmax(0, 1fr) 45px',
		gridTemplateRows: 'minmax(0, 1fr)',
		borderBottomWidth: '1px',
		borderColor: 'border.default',
	},
});

export const Header = chakra('div', {});
export const Body = chakra('div', {});
