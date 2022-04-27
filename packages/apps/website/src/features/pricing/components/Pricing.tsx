import React from 'react';
import Helmet from 'react-helmet';
import { SmallContainer } from '@beak/app-website/components/atoms/Container';
import { SubTitle, Title, TitleSubtle } from '@beak/app-website/components/atoms/Typography';
import styled from 'styled-components';

import QuestionsAndAnswers from './molecules/QuestionsAndAnswers';
import PricingCardGrid from './organisms/PricingCardGrid';

const Pricing: React.FC<React.PropsWithChildren<unknown>> = () => (
	<React.Fragment>
		<Helmet defer={false}>
			<title>{'Pricing :: Beak'}</title>
		</Helmet>
		<Header>
			<SmallContainer>
				<TitleSubtle>{'Pricing'}</TitleSubtle>
				<Title>{'One pricing tier to rule them all'}</Title>
				<SubTitle>{'No complicated plans or locked features... One price for it all'}</SubTitle>
			</SmallContainer>
		</Header>
		<PricingCardGrid />
		<QuestionsAndAnswers />
	</React.Fragment>
);

export default Pricing;

const Header = styled.div`
	padding-top: 80px;
	padding-bottom: 80px;

	background: ${p => p.theme.ui.background};

	@media (max-width: 850px) {
		padding-top: 40px;
		padding-bottom: 40px;
	}
`;
