import React, { useState } from 'react';
import styled from 'styled-components';

import CreateView from '../features/welcome/components/organisms/CreateView';
import WelcomeView from '../features/welcome/components/organisms/WelcomeView';

export type WelcomeViewType = 'main' | 'create-local';

const Welcome: React.FunctionComponent = () => {
	const [view, setView] = useState<WelcomeViewType>('create-local');

	return (
		<React.Fragment>
			<BrandIndicatorTop />
			<BrandIndicatorBottom style={{opacity: view === 'main' ? 1 : 0}} />
			<DragBar />

			<Container>
				{view === 'main' && <WelcomeView setView={setView} />}
				{view === 'create-local' && <CreateView setView={setView} />}
			</Container>
		</React.Fragment>
	);
};

const BrandIndicatorTop = styled.div`
	position: absolute;
	top: -130px;
	left: -25px;
	width: 100px;
	height: 250px;
	transform: rotate(45deg);
	z-index: 1;

	background: ${props => props.theme.ui.primaryFill};
`;

const BrandIndicatorBottom = styled.div`
	position: absolute;
	bottom: -340px;
	right: -100px;
	width: 400px;
	height: 700px;
	transform: rotate(45deg);
	z-index: 1;

	transition: opacity .5s linear;

	background: ${props => props.theme.ui.primaryFill};
`;

const DragBar = styled.div`
	-webkit-app-region: drag;
	position: absolute;
	top: 0;
	left: 0;
	right: 0;
	height: 80px;
`;

const Container = styled.div`
	position: relative;
	margin: 40px 30px;

	z-index: 2;
`;

export default Welcome;
