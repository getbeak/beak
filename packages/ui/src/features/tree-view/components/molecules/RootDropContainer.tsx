import React from 'react';
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
		<Container $dropAccepted={canDrop} $dropHovering={hovering} ref={dropRef as unknown as React.Ref<HTMLDivElement>}>
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

	${p =>
		p.$dropAccepted &&
		p.$dropHovering &&
		css`
		border-radius: 4px;
		background-color: color-mix(in srgb, var(--beak-colors-accent-pink) 60%, transparent);
	`}
`;

export default RootDropContainer;
