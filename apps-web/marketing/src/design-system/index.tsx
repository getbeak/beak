'use client';

import { createGlobalStyle } from 'styled-components';

const GlobalStyle = createGlobalStyle`
	body {
		font-family: 'Open Sans', sans-serif;
		background: ${p => p.theme.ui.secondaryBackground};
		color: ${p => p.theme.ui.textOnSurfaceBackground};

		margin: 0; padding: 0;
	}

	* {
		transition: background-color 250ms ease;
	}

	a {
		color: #ffa210;
	}
`;

export { GlobalStyle };
