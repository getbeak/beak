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
	*:not([class^="ace_"]) {
		font-family: ${props => props.theme.fonts.default};
	}

	html, body {
		font-family: ${props => props.theme.fonts.default};
		background-color: ${props => props.theme.ui.background};
		background-color: transparent; // This is needed for Vibrancy

		color: ${props => props.theme.ui.textOnAction};
		margin: 0;
		padding: 0;

		overflow: hidden;
		-webkit-user-select: none;
	}

	.bvs-blob {
		display: inline-block;
		padding: 1px 3px;
		margin-left: 1px; margin-right: 0;
		border-radius: 4px;
		font-size: 11px;
		line-height: 12px;
		background: ${p => p.theme.ui.primaryFill};
		color: ${props => props.theme.ui.textOnAction};

		> strong {
			font-weight: 600;
		}
	}
`;

export {
	DesignSystemProvider,
	GlobalStyle,
};
