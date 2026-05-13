import { Box } from '@chakra-ui/react';
import * as React from 'react';

import { useNodeDrop } from '../../hooks/drag-and-drop';

const RootDropContainer: React.FC<React.PropsWithChildren> = ({ children }) => {
	const [{ canDrop, hovering }, dropRef] = useNodeDrop({
		id: 'root',
		filePath: 'tree',
		name: '',
		parent: null,
		type: 'folder',
	});

	const highlight = canDrop && hovering;

	return (
		<Box
			ref={dropRef as unknown as React.Ref<HTMLDivElement>}
			h='100%'
			_focus={{ outline: 'none' }}
			borderRadius={highlight ? 'md' : undefined}
			borderWidth={highlight ? '1px' : undefined}
			borderStyle={highlight ? 'dashed' : undefined}
			borderColor={highlight ? 'accent.pink' : undefined}
			bg={highlight ? 'color-mix(in srgb, var(--beak-colors-accent-pink) 18%, transparent)' : undefined}
			boxShadow={highlight ? '0 0 0 2px color-mix(in srgb, var(--beak-colors-accent-pink) 30%, transparent), inset 0 0 24px color-mix(in srgb, var(--beak-colors-accent-pink) 14%, transparent)' : undefined}
			transition='background-color .14s ease, border-color .14s ease, box-shadow .14s ease'
		>
			{children}
		</Box>
	);
};

export default RootDropContainer;
