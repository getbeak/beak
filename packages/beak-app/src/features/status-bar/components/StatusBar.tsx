import React from 'react';
import styled from 'styled-components';

import StatusBarContainer from './atoms/StatusBarContainer';

const StatusBar: React.FunctionComponent = () => (
	<StatusBarContainer>
		<Wrapper>
			{'waiting... 🤔'}
		</Wrapper>
	</StatusBarContainer>
);

export default StatusBar;

const Wrapper = styled.div`
	background-color: ${props => props.theme.ui.primaryFill};
	height: 24px;

	line-height: 24px;
	color: ${props => props.theme.ui.textOnSurfaceBackground};
	font-size: 12px;

	padding: 0 10px;
`;
