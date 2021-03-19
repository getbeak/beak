import React from 'react';
import styled, { keyframes } from 'styled-components';

const pulse = keyframes`
	0% {
		transform: scale(1);
		opacity: 1
	}

	25% {
		transform: scale(1.2);
		opacity: 0.8;
	}

	50% {
		transform: scale(1);
		opacity: 0.9;
	}

	75% {
		transform: scale(0.8);
		opacity: 1;
	}

	100% {
		transform: scale(1);
		opacity: 0.8;
	}
}
`;

const SneakPeak: React.FunctionComponent = () => (
	<Wrapper>
		<Gradient />
		<AppImage alt={'The Beak application'} src={'/assets/home.png'} />
	</Wrapper>
);

const Wrapper = styled.div`
	display: grid;
	grid-template: 1fr / 1fr;
	place-items: center;

	margin-top: 150px;

	> * {
		grid-column: 1 / 1;
		grid-row: 1 / 1;
	}
`;

const Gradient = styled.div`
	z-index: 1;
	width: 100%;
	height: 500px;

	animation: ${pulse} 20s infinite;

	filter: blur(130px);
	background: conic-gradient(
		from 0 at 45% 65%,
		#d45d80AA 0deg,
		#333399AA 120deg,
		#8d40f8AA 180deg,
		#ff81a7AA 60deg,
		#1A1E2DAA 360deg
	);
`;

const AppImage = styled.img`
	z-index: 2;
	max-width: 100%;
	object-fit: contain;
`;

export default SneakPeak;
