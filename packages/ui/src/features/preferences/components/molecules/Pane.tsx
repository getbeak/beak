import { Box } from '@chakra-ui/react';
import { motion } from 'framer-motion';
import * as React from 'react';

interface PaneProps {
	title: string;
}

const MotionBox = motion.create(Box);

const Pane: React.FC<React.PropsWithChildren<PaneProps>> = ({ title, children }) => (
	<Box
		px='8'
		pt='8'
		pb='6'
		h='calc(100% - 50px)'
		overflowY='auto'
		style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
	>
		<MotionBox
			initial={{ opacity: 0, y: -4 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.18, ease: 'easeOut' }}
			fontSize='2xl'
			fontWeight='600'
			color='fg.default'
			letterSpacing='-0.01em'
		>
			{title}
		</MotionBox>
		<Box
			h='1px'
			my='3'
			bg='border.subtle'
			style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
		/>
		<Box style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
			{children}
		</Box>
	</Box>
);

export default Pane;
