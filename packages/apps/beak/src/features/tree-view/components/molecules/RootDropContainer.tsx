import React from 'react';
import { toHexAlpha } from '@beak/shared-design-system/utils';
import styled, { css } from 'styled-components';

import { useNodeDrop } from '../../hooks/drag-and-drop';

const RootDropContainer: React.FC<React.PropsWithChildren<unknown>> = props => {
	const [{ canDrop, hovering }, dropRef] = useNodeDrop({
		id: 'root',
		filePath: 'tree',
		name: '',
		parent: null,
		type: 'folder',
	});

	return (
		<Container
			$dropAccepted={canDrop}
			$dropHovering={hovering}
			ref={dropRef}
		>
			{props.children}
		</Container>
	);
};

interface ContainerProps {
	$dropAccepted: boolean;
	$dropHovering: boolean;
}

const Container = styled.div<ContainerProps>`
	height: 100%;

	&:focus {
		outline: none;
	}

	${p => p.$dropAccepted && p.$dropHovering && css`
		border-radius: 4px;
		background-color: ${toHexAlpha(p.theme.ui.primaryFill, 0.6)};
	`}
`;

export default RootDropContainer;
