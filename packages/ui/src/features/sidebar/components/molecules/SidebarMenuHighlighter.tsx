import { Box } from '@chakra-ui/react';
import { motion } from 'framer-motion';
import * as React from 'react';

interface SidebarMenuHighlighterProps {
	index: number;
	hidden: boolean;
}

const SidebarMenuHighlighter: React.FC<SidebarMenuHighlighterProps> = ({ index, hidden }) => {
	if (hidden || index === -1) return null;
	return (
		<Box position='absolute' top='0' bottom='0' left='0' pointerEvents='none'>
			<motion.div
				animate={{ y: index * 40 }}
				initial={false}
				transition={{ type: 'spring', stiffness: 700, damping: 36 }}
				style={{
					width: 2,
					height: 40,
					background: 'var(--beak-colors-accent-pink)',
					borderTopRightRadius: 2,
					borderBottomRightRadius: 2,
					willChange: 'transform',
				}}
			/>
		</Box>
	);
};

export default SidebarMenuHighlighter;
