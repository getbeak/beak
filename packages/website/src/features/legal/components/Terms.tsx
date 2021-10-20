import { SmallContainer } from '@beak/website/components/atoms/Container';
import { SubTitle, Title, TitleSubtle } from '@beak/website/components/atoms/Typography';
import React from 'react';
import Helmet from 'react-helmet';
import styled from 'styled-components';

const Terms: React.FunctionComponent = () => (
	<React.Fragment>
		<Helmet defer={false}>
			<title>{'Terms :: Beak'}</title>
		</Helmet>
		<Header>
			<SmallContainer>
				<TitleSubtle>{'Legal'}</TitleSubtle>
				<Title>{'Terms'}</Title>
				<SubTitle>{'You know you want to read them'}</SubTitle>
			</SmallContainer>
		</Header>
	</React.Fragment>
);

export default Terms;

const Header = styled.div`
	padding-top: 80px;
	padding-bottom: 80px;

	background: ${p => p.theme.ui.background};

	@media (max-width: 850px) {
		padding-top: 40px;
		padding-bottom: 40px;
	}
`;
