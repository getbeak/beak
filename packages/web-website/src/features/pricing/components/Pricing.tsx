import React from 'react';
import styled from 'styled-components';

import { SmallContainer } from '../../../components/atoms/Container';
import { SubTitle, Title, TitleSubtle } from '../../../components/atoms/Typography';
import QuestionsAndAnswers from './molecules/QuestionsAndAnswers';
import PricingCardGrid from './organisms/PricingCardGrid';

const Pricing: React.FC<React.PropsWithChildren<unknown>> = () => (
	<React.Fragment>
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

	background: ${p => p.theme.ui.surfaceHighlight};

	@media (max-width: 850px) {
		padding-top: 40px;
		padding-bottom: 40px;
	}
`;
