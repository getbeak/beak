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
		h='100%'
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
			lineHeight='1.1'
		>
			{title}
		</MotionBox>
		<Box
			mt='4'
			mb='4'
			h='1px'
			bg='linear-gradient(to right, color-mix(in srgb, var(--beak-colors-accent-pink) 35%, transparent), color-mix(in srgb, var(--beak-colors-border-default) 70%, transparent) 40%, transparent 100%)'
			style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
		/>
		<Box style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
			{children}
		</Box>
	</Box>
);

export default Pane;
