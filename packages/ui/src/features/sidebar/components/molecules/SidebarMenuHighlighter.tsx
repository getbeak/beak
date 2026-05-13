import { Box } from '@chakra-ui/react';
import * as React from 'react';

interface SidebarMenuHighlighterProps {
	index: number;
	hidden: boolean;
	itemHeight?: number;
}

const SidebarMenuHighlighter: React.FC<SidebarMenuHighlighterProps> = ({ index, hidden, itemHeight = 40 }) => {
	if (hidden || index === -1) return null;

	const railHeight = 18;
	const top = index * itemHeight + (itemHeight - railHeight) / 2;

	return (
		<Box
			position='absolute'
			left='0'
			top={`${top}px`}
			w='2px'
			h={`${railHeight}px`}
			bg='accent.pink'
			borderTopRightRadius='2px'
			borderBottomRightRadius='2px'
			pointerEvents='none'
			transition='top .18s cubic-bezier(.4,.0,.2,1)'
			boxShadow='0 0 8px color-mix(in srgb, var(--beak-colors-accent-pink) 55%, transparent)'
		/>
	);
};

export default SidebarMenuHighlighter;
