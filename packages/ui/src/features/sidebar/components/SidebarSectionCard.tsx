import { chakra } from '@chakra-ui/react';

const SidebarSectionCard = chakra('div', {
	base: {
		px: '2.5',
		py: '2',
		borderRadius: 'lg',
		textAlign: 'center',
		fontSize: 'md',
		bg: 'color-mix(in srgb, var(--beak-colors-bg-surface) 50%, transparent)',
		backdropFilter: 'blur(10px)',
	},
});

export default SidebarSectionCard;
