import { keyframes } from 'styled-components';

export const scaleIn = keyframes`
	0% {
		transform: scale(.97);
		opacity: 0;
	}

	100% {
		transform: scale(1);
		opacity: 1;
	}
`;

export const fadeIn = keyframes`
	0% {
		opacity: 0;
	}

	100% {
		opacity: 1;
	}
`;
