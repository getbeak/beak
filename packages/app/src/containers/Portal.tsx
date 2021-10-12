import React from 'react';
import styled from 'styled-components';

import { toVibrancyAlpha } from '../design-system/utils';
import Purchase from '../features/portal/components/Purchase';
import SignIn from '../features/portal/components/SignIn';

const Portal: React.FunctionComponent = () => (
	<Wrapper>
		<Accent />
		<Container>
			<SignIn />
			<Purchase />
		</Container>
	</Wrapper>
);

const Wrapper = styled.div`
	position: relative;
	height: 100vh; width: 100vw;
	-webkit-app-region: drag;
`;

const Accent = styled.div`
	position: absolute;
	top: 0; bottom: 0; left: 375px;

	width: 900px; height: 700px;
	background: ${p => toVibrancyAlpha(p.theme.ui.primaryFill, 0.75)};

	transform: rotate(20deg);
	transform-origin: center;
`;

const Container = styled.div`
	position: absolute;
	display: grid;
	grid-template-columns: repeat(2, .5fr);
	grid-template-rows: 1fr;
	gap: 50px;
	width: calc(100% - 100px); height: calc(100% - 100px);
	margin: 50px;
`;

export default Portal;
