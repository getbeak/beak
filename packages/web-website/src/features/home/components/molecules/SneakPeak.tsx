import React from 'react';
import { pulse } from '@beak/web-website/design-system/keyframes';
import styled from 'styled-components';

const SneakPeak: React.FC<React.PropsWithChildren<unknown>> = () => (
	<Wrapper>
		<Gradient />
		<AppPicture>
			<source media={'(prefers-color-scheme: light)'} srcSet={'/images/home-trans-light.webp'} type={'image/webp'} />
			<source media={'(prefers-color-scheme: dark)'} srcSet={'/images/home-trans-dark.webp'} type={'image/webp'} />
			<source media={'(prefers-color-scheme: light)'} srcSet={'/images/home-trans-light.png'} type={'image/png'} />
			<source media={'(prefers-color-scheme: dark)'} srcSet={'/images/home-trans-dark.png'} type={'image/png'} />
			<AppImage loading={'eager'} src={'/images/home-trans-dark.png'} alt={'A preview of Beak, showing how a project, request, and response are displayed.'} />
		</AppPicture>
	</Wrapper>
);

const Wrapper = styled.div`
	display: grid;
	grid-template: 1fr / 1fr;
	place-items: center;

	margin-top: min(10vw, 50px);

	> * {
		grid-column: 1 / 1;
		grid-row: 1 / 1;
	}
`;

const Gradient = styled.div`
	z-index: 1;
	width: 100%;
	max-width: 100%;
	height: 500px;

	transform: scale(0.8);
	animation: ${pulse} 20s infinite;

	filter: blur(180px);
	background: conic-gradient(
		from 0 at 45% 65%,
		#d45d80AA 0deg,
		#333399AA 120deg,
		#FC3233AA 180deg,
		#ff81a7AA 260deg
	);

	@media (max-width: 676px) {
		display: none;
	}
`;

const AppImage = styled.img`
	z-index: 2;
	max-width: 90%;
	object-fit: contain;

	@media (max-width: 676px) {
		max-width: 100%;
	}
`;

const AppPicture = styled(AppImage).attrs({ as: 'picture' })``;

export default SneakPeak;
