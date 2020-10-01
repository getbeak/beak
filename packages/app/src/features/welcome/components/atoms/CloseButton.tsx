import React from 'react';
import styled from 'styled-components';

const CloseButton: React.FunctionComponent = () => (
	<Wrapper>{'x'}</Wrapper>
);

const Wrapper = styled.button`
	border: none;
	background: transparent;
	color: ${props => props.theme.ui.textOnSurfaceBackground};
`;

export default CloseButton;
