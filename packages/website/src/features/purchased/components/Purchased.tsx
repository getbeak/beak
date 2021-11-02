import { SmallContainer } from '@beak/website/components/atoms/Container';
import { SubTitle, Title, TitleSubtle } from '@beak/website/components/atoms/Typography';
import React from 'react';
import Helmet from 'react-helmet';
import styled from 'styled-components';

const Purchased: React.FunctionComponent = () => (
	<React.Fragment>
		<Helmet defer={false}>
			<title>{'Subscribed :: Beak'}</title>
		</Helmet>
		<Header>
			<SmallContainer>
				<TitleSubtle>{'🎉'}</TitleSubtle>
				<Title>{'Thank you for subscribing'}</Title>
				<SubTitle>{'Welcome to the flock!'}</SubTitle>
			</SmallContainer>
		</Header>
		<SmallContainer>
			
		</SmallContainer>
	</React.Fragment>
);

export default Purchased;

const Header = styled.div`
	padding-top: 80px;
	padding-bottom: 80px;

	background: ${p => p.theme.ui.background};

	@media (max-width: 850px) {
		padding-top: 40px;
		padding-bottom: 40px;
	}
`;
