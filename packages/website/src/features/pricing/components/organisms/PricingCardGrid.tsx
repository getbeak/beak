import { SmallContainer } from '@beak/website/components/atoms/Container';
import React from 'react';
import styled, { keyframes } from 'styled-components';

import PricingCard from './PricingCard';

const pulse = keyframes`
	0% {
		transform: scale(1);
		opacity: 1
	}

	25% {
		transform: scale(1.2);
	}

	50% {
		transform: scale(0.9);
		opacity: 0.8;
	}

	75% {
		transform: scale(1.3);
	}

	100% {
		transform: scale(1);
		opacity: 1;
	}
}
`;

const PricingCards: React.FunctionComponent = () => (
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

	background: ${p => p.theme.ui.surface};

	@media (max-width: 850px) {
		padding-top: 50px 0;
	}
`;

const Mask = styled.div`
	position: absolute;
	top: 60px; bottom: 60px; left: 0; right: 0;

	animation: ${pulse} 20s infinite;

	filter: blur(100px);
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
	/* gap: 20px; */
`;

const TinyCard = styled.div`
	transform: scale(0.75);
	transform-origin: center;
	opacity: 0.8;

	@media (max-width: 751px) {
		display: none;
	}
`;
