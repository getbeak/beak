import React from 'react';
import { createGlobalStyle, ThemeProvider } from 'styled-components';

import brand from './brand';
import fonts from './fonts';
import { createUiColors } from './themes';
import { DesignSystem, Theme } from './types';

function createDesignSystem(themeKey: Theme): DesignSystem {
	return {
		ui: createUiColors(brand, themeKey),

		brand,
		fonts,
	};
}

const DesignSystemProvider: React.FunctionComponent<{ themeKey: Theme }> = ({ children, themeKey }) => (
	<ThemeProvider theme={createDesignSystem(themeKey)}>{children}</ThemeProvider>
);

const GlobalStyle = createGlobalStyle`
	* {
		font-family: ${props => props.theme.fonts.default};
	}

	html, body {
		background-color: ${props => props.theme.ui.background};
		color: ${props => props.theme.ui.textOnAction};

		overflow: hidden;
		-webkit-user-select: none;
	}
`;

export {
	DesignSystemProvider,
	GlobalStyle,
};
