import { createGlobalStyle } from 'styled-components';

const GlobalStyle = createGlobalStyle`
	body {
		font-family: 'Open Sans', sans-serif;
		background: ${p => p.theme.ui.secondaryBackground};
		color: ${p => p.theme.ui.textOnSurfaceBackground};

		margin: 0; padding: 0;
	}
`;

export { GlobalStyle };
