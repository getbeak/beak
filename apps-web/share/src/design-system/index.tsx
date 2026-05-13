import { createGlobalStyle } from 'styled-components';

const GlobalStyle = createGlobalStyle`
	body {
		font-family: 'Open Sans', sans-serif;
		background: var(--beak-colors-bg-canvas-alt);
		color: var(--beak-colors-fg-default);

		margin: 0; padding: 0;
	}

	a {
		color: #ffa210;
	}
`;

export { GlobalStyle };
