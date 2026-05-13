import { Box } from '@chakra-ui/react';
import * as React from 'react';

interface PaneProps {
	title: string;
}

const Pane: React.FC<React.PropsWithChildren<PaneProps>> = ({ title, children }) => (
	<Box
		px='10'
		pt='12'
		h='calc(100% - 50px)'
		style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
	>
		<Box fontSize='2xl' fontWeight='medium'>{title}</Box>
		<Box mt='5' bg='transparent' style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
			{children}
		</Box>
	</Box>
);

export default Pane;
