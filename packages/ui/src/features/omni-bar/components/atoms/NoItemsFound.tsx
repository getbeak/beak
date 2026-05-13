import { chakra } from '@chakra-ui/react';

const NoItemsFound = chakra('div', {
	base: {
		fontSize: 'md',
		ml: '3',
		py: '3',
		color: 'fg.muted',
	},
});

export default NoItemsFound;
