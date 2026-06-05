import { Box } from '@chakra-ui/react';
import { ChevronRight } from 'lucide-react';
import * as React from 'react';

interface ChevronProps {
	$collapsed: boolean;
	$collapsible: boolean;
}

const Chevron: React.FC<ChevronProps> = ({ $collapsed, $collapsible }) => (
	<Box
		display={$collapsible ? 'inline-flex' : 'none'}
		alignItems='center'
		justifyContent='center'
		mr='0.5'
		ml='1'
		w='12px'
		h='12px'
		color='fg.subtle'
		transform={$collapsed ? 'rotate(0deg)' : 'rotate(90deg)'}
		transition='transform .16s ease-out'
	>
		<ChevronRight size={11} strokeWidth={2.2} />
	</Box>
);

export default Chevron;
