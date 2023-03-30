import { keyframes } from 'styled-components';

export const pulse = keyframes`
0% {
	transform: scale(0.8);
	opacity: 1
}

25% {
	transform: scale(1.1);
}

50% {
	transform: scale(0.5);
	opacity: 0.8;
}

75% {
	transform: scale(1.2);
}

100% {
	transform: scale(0.8);
	opacity: 1;
}
`;
