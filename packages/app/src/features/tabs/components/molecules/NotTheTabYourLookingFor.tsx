import React from 'react';
import styled from 'styled-components';

const NotTheTabYourLookingFor: React.FunctionComponent = () => (
	<Wrapper>
		<Header>{'This is not the tab you\'re looking for...'}</Header>
		<Body>{'Also not really sure how you did this 🤔'}</Body>
	</Wrapper>
);

const Wrapper = styled.div`
	height: 100%;
	text-align: center;
	background: ${p => p.theme.ui.background};
	padding: 20px 25px;
`;

const Header = styled.h1`
	margin: 0;
	font-weight: 400;
	font-size: 35px;
	color: ${p => p.theme.ui.textOnFill};
`;

const Body = styled.p`
	font-size: 14px;
	color: ${p => p.theme.ui.textOnFill};
`;

export default NotTheTabYourLookingFor;
