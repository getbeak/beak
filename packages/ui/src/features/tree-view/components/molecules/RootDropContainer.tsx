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
			borderRadius={highlight ? 'sm' : undefined}
			bg={highlight ? 'color-mix(in srgb, var(--beak-colors-accent-pink) 60%, transparent)' : undefined}
		>
			{children}
		</Box>
	);
};

export default RootDropContainer;
