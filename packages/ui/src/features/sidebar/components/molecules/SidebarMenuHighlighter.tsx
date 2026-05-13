import { Box } from '@chakra-ui/react';
import * as React from 'react';

interface SidebarMenuHighlighterProps {
	index: number;
	hidden: boolean;
}

const SidebarMenuHighlighter: React.FC<SidebarMenuHighlighterProps> = ({ index, hidden }) => (
	<Box display={hidden ? 'none' : 'block'} position='absolute' top='0' bottom='0' left='0'>
		<Box
			w='2px'
			h='40px'
			bg='accent.pink'
			transition='margin-top .2s ease'
			display={index === -1 ? 'none' : 'block'}
			style={{ marginTop: `${index * 40}px` }}
		/>
	</Box>
);

export default SidebarMenuHighlighter;
