import React from 'react';
import styled from 'styled-components';

interface SidebarMenuHighlighterProps {
	index: number;
	hidden: boolean;
}

const SidebarMenuHighlighter: React.FC<React.PropsWithChildren<SidebarMenuHighlighterProps>> = props => (
	<Container $hidden={props.hidden}>
		<HighlightBar $index={props.index} />
	</Container>
);

const Container = styled.div<{ $hidden: boolean }>`
	display: ${p => p.$hidden ? 'none' : 'block'};
	position: absolute;
	top: 0; bottom: 0; left: 0;
`;

const HighlightBar = styled.div<{ $index: number }>`
	width: 2px;
	height: 40px;
	background: ${p => p.theme.ui.primaryFill};

	transition: margin-top .2s ease;

	display: ${p => p.$index === -1 ? 'none' : 'block'};
	margin-top: ${p => p.$index * 40}px;
`;

export default SidebarMenuHighlighter;
