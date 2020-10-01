import React, { useState } from 'react';
import styled from 'styled-components';

import CloseButton from '../features/welcome/components/atoms/CloseButton';
import CreateView from '../features/welcome/components/organisms/CreateView';
import WelcomeView from '../features/welcome/components/organisms/WelcomeView';

export type WelcomeViewType = 'main' | 'create-local';

const Welcome: React.FunctionComponent = () => {
	const [view, setView] = useState<WelcomeViewType>('main');

	return (
		<Wrapper>
			<BrandIndicatorTop />
			<BrandIndicatorBottom />
			<DragBar />
			<Closer>
				<CloseButton />
			</Closer>

			<Container>
				{view === 'main' && <WelcomeView setView={setView} />}
				{view === 'create-local' && <CreateView setView={setView} />}
			</Container>
		</Wrapper>
	);
};

const Wrapper = styled.div`

`;

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

	background: ${props => props.theme.ui.primaryFill};
`;

const DragBar = styled.div`
	position: absolute;
	top: 0;
	left: 0;
	right: 0;
	height: 80px;
`;

const Closer = styled.div`
	position: absolute;
	top: 15px;
	right: 10px;
	z-index: 2;
`;

const Container = styled.div`
	position: relative;
	margin: 40px 30px;

	z-index: 2;
`;

export default Welcome;
