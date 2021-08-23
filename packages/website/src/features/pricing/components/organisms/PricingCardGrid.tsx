import { SmallContainer } from '@beak/website/components/atoms/Container';
import React from 'react';
import styled from 'styled-components';

import PricingCard from './PricingCard';

const PricingCards: React.FunctionComponent = () => (
	<Wrapper>
		<SmallContainer>
			<Cards>
				<TinyCard>
					<PricingCard />
				</TinyCard>
				<PricingCard />
				<TinyCard>
					<PricingCard />
				</TinyCard>
			</Cards>
		</SmallContainer>
	</Wrapper>
);

export default PricingCards;

const Wrapper = styled.div`
	padding: 80px 0;

	background: ${p => p.theme.ui.surface};

	@media (max-width: 850px) {
		padding-top: 50px 0;
	}
`;

const Cards = styled.div`
	display: flex;
	gap: 20px;
`;

const TinyCard = styled.div`
	transform: scale(0.75);
	transform-origin: center;
	opacity: 0.8;

	@media (max-width: 751px) {
		display: none;
	}
`;
