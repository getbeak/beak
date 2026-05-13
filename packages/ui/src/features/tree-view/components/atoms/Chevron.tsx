import { Box } from '@chakra-ui/react';
import { motion } from 'framer-motion';
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
		ml='1'
		w='10px'
		h='10px'
		lineHeight='10px'
		color='fg.muted'
	>
		<motion.span
			style={{ display: 'inline-block', transformOrigin: 'center' }}
			animate={{ rotate: $collapsed ? 0 : 90 }}
			transition={{ duration: 0.16, ease: 'easeOut' }}
		>
			<ChevronRight size={10} />
		</motion.span>
	</Box>
);

export default Chevron;
