import { chakra } from '@chakra-ui/react';

export const Container = chakra('div', {
	base: {
		mx: 'auto',
		px: '6',
		w: 'calc(100% - 50px)',
		maxW: '1200px',
	},
});

export const SmallContainer = chakra('div', {
	base: {
		mx: 'auto',
		px: '6',
		w: 'calc(100% - 50px)',
		maxW: '800px',
	},
});

export default Container;
