import { SmallContainer } from '@beak/website/components/atoms/Container';
import { SubTitle, Title, TitleSubtle } from '@beak/website/components/atoms/Typography';
import React from 'react';
import Helmet from 'react-helmet';
import styled from 'styled-components';

import QuestionsAndAnswers from './molecules/QuestionsAndAnswers';
import PricingCardGrid from './organisms/PricingCardGrid';

const Pricing: React.FunctionComponent = () => (
	<React.Fragment>
		<Helmet defer={false}>
			<title>{'Pricing :: Beak'}</title>
		</Helmet>
		<Header>
			<SmallContainer>
				<TitleSubtle>{'Pricing'}</TitleSubtle>
				<Title>{'One pricing tier to rule them all.'}</Title>
				<SubTitle>{'Beak isn\'t ready yet, you shouldn\'t be here'}</SubTitle>
			</SmallContainer>
		</Header>
		<PricingCardGrid />
		<QuestionsAndAnswers />
	</React.Fragment>
);

export default Pricing;

const Header = styled.div`
	padding-top: 125px;
	padding-bottom: 80px;

	background: ${p => p.theme.ui.background};

	@media (max-width: 850px) {
		padding-top: 50px;
		padding-bottom: 40px;
	}
`;
