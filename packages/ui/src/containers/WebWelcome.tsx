import React from 'react';
import styled from 'styled-components';

import { FakeWindow } from '../components/atoms/FakeWindow';
import Welcome from './Welcome';

const WebWelcome: React.FC = () => (
	<Background>
		<FakeWindow $height={500} $width={900}>
			<Welcome />
		</FakeWindow>
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

export default WebWelcome;
