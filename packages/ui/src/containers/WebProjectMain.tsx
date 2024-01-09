import React from 'react';
import styled from 'styled-components';

import ProjectMain from './ProjectMain';

const WebProjectMain: React.FC = () => (
	<Background>
		<ProjectMain />
	</Background>
);

const Background = styled.div`
	display: flex;
	justify-content: center;
	align-items: center;

	height: 100vh;
	width: 100vw;

	background: url('./images/backgrounds/temp.jpg');
	background-repeat: no-repeat;
	background-size: cover;
`;

export default WebProjectMain;
