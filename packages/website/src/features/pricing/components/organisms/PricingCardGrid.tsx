import React from 'react';
import { SmallContainer } from '@beak/website/components/atoms/Container';
import { pulse } from '@beak/website/design-system/keyframes';
import styled from 'styled-components';

import PricingCard from './PricingCard';

const PricingCards: React.FC<React.PropsWithChildren<unknown>> = () => (
	<Wrapper>
		<Container>
			<Mask />
			<Cards>
				<TinyCard>
					<PricingCard version={'secondary'} />
				</TinyCard>
				<PricingCard version={'primary'} />
				<TinyCard>
					<PricingCard version={'tertiary'} />
				</TinyCard>
			</Cards>
		</Container>
	</Wrapper>
);

export default PricingCards;

const Container = styled(SmallContainer)`
	position: relative;
`;

const Wrapper = styled.div`
	padding: 80px 0;

	overflow: hidden;
	background: ${p => p.theme.ui.surface};

	@media (max-width: 850px) {
		padding-top: 50px 0;
	}
`;

const Mask = styled.div`
	position: absolute;
	top: 60px; bottom: 60px; left: 0; right: 0;
	z-index: 1;

	transform: scale(0.8);
	animation: ${pulse} 20s infinite;

	filter: blur(130px);
	background: conic-gradient(
		from 0 at 45% 65%,
		#d45d80AA 0deg,
		#333399AA 120deg,
		#FC3233AA 180deg,
		#ff81a7AA 260deg
	);
`;

const Cards = styled.div`
	position: relative;
	display: flex;
	z-index: 2;
`;

const TinyCard = styled.div`
	transform: scale(0.75);
	transform-origin: center;
	opacity: 0.8;

	@media (max-width: 751px) {
		display: none;
	}
`;
