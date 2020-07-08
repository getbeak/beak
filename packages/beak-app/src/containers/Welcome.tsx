import React from 'react';
import { Container as GridContainer, Row } from 'react-grid-system';
import styled from 'styled-components';

import GetStartedColumn from '../features/welcome/components/organisms/GetStartedColumn';
import OpenRecentColumn from '../features/welcome/components/organisms/OpenRecentColumn';

const Welcome: React.FunctionComponent = () => (
	<React.Fragment>
		<BrandIndicatorTop />
		<BrandIndicatorBottom />
		<DragBar />

		<Container>
			<Title>{'Welcome to Beak!'}</Title>
			<IntroLine>{'Yet another API client for you to install...'}</IntroLine>

			<GridContainer fluid>
				<Row>
					<OpenRecentColumn />
					<GetStartedColumn />
				</Row>
			</GridContainer>
		</Container>
	</React.Fragment>
);

const DragBar = styled.div`
	position: absolute;
	top: 0;
	left: 0;
	right: 0;
	height: 80px;

	-webkit-user-select: none;
	-webkit-app-region: drag;
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

const Container = styled.div`
	position: relative;
	margin: 40px 30px;

	z-index: 2;
`;

const Title = styled.h1`
	margin-bottom: 0;
	font-size: 35px;
	font-weight: 300;
`;

const IntroLine = styled.p`
	font-size: 15px;
	margin-top: 0px;
	margin-bottom: 25px;
	color: ${props => props.theme.ui.textMinor};
`;

export default Welcome;
