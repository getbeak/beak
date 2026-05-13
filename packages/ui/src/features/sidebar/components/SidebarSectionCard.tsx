import { chakra } from '@chakra-ui/react';

const SidebarSectionCard = chakra('div', {
	base: {
		px: '2',
		py: '1.5',
		borderRadius: 'md',
		fontSize: '11px',
		lineHeight: '1.4',
		color: 'fg.muted',
		bg: 'color-mix(in srgb, var(--beak-colors-bg-surface) 60%, transparent)',
		borderWidth: '1px',
		borderColor: 'border.subtle',
	},
});

export default SidebarSectionCard;
