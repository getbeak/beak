import { chakra } from '@chakra-ui/react';

const TabSpacer = chakra('div', {
	base: {
		flexGrow: 2,
		h: 'calc(100% - 1px)',
		borderBottomWidth: '1px',
		borderColor: 'border.default',
	},
});

export default TabSpacer;
