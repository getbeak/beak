import React from 'react';
import styled from 'styled-components';

interface PreviewContainerProps {
	text: string;
}

const PreviewContainer: React.FC<PreviewContainerProps> = ({ text }) => (
	<Container>
		<PreviewHint>{'Preview'}</PreviewHint>
		{text}
	</Container>
);

const Container = styled.div`
	position: relative;
	background: ${p => p.theme.ui.secondarySurface};
	margin: 10px -12px;
	padding: 10px 12px;
	padding-top: 25px;

	max-height: 100px;
	overflow-y: overlay;
	overflow-x: hidden;
	overflow-wrap: break-word;
`;

const PreviewHint = styled.div`
	position: absolute;
	top: 5px;
	left: 5px;
	text-transform: uppercase;
	font-size: 9px;
`;

export default PreviewContainer;
