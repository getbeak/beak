import { Box, type BoxProps } from '@chakra-ui/react';
import * as React from 'react';

/**
 * Marks a region of the Electron window as draggable.
 *
 * `-webkit-app-region: drag` is set via the inline style prop (Chakra v3's
 * typed style props don't cover that vendor extension). Children are made
 * non-interactive so the drag doesn't fight with click handlers on icons.
 */
const DraggableContainer: React.FC<BoxProps> = ({ children, style, ...rest }) => (
	<Box
		style={{ WebkitAppRegion: 'drag', ...(style as React.CSSProperties) } as React.CSSProperties}
		css={{ '& *': { pointerEvents: 'none' } }}
		{...rest}
	>
		{children}
	</Box>
);

export default DraggableContainer;
