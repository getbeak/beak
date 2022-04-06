import React from 'react';
import styled from 'styled-components';

interface SidebarMenuHighlighterProps {
	currentIndex: number;
}

const SidebarMenuHighlighter: React.FunctionComponent<SidebarMenuHighlighterProps> = props => (
	<Container>
		<HighlightBar $index={props.currentIndex} />
	</Container>
);

const Container = styled.div`
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
