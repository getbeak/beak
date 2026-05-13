import { Box } from '@chakra-ui/react';
import { ChevronRight } from 'lucide-react';
import * as React from 'react';

interface ChevronProps {
	$collapsed: boolean;
	$collapsible: boolean;
}

const Chevron: React.FC<ChevronProps> = ({ $collapsed, $collapsible }) => (
	<Box
		display={$collapsible ? 'inline-block' : 'none'}
		mr='0.5'
		ml='1.5'
		w='10px'
		fontSize='9px'
		lineHeight='9px'
		color='fg.muted'
		css={{
			'> svg': {
				transition: 'transform .2s ease',
				transformOrigin: 'center center',
				transform: $collapsed ? 'rotate(0deg)' : 'rotate(90deg)',
			},
		}}
	>
		<ChevronRight size={9} />
	</Box>
);

export default Chevron;
