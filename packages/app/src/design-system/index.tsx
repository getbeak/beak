import React from 'react';
import { createGlobalStyle, ThemeProvider } from 'styled-components';

import { getGlobal } from '../globals';
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
		font-family: ${p => p.theme.fonts.default};
	}

	* {
		-webkit-font-smoothing: subpixel-antialiased;
	}

	html, body {
		font-family: ${p => p.theme.fonts.default};

		// This is needed for Vibrancy
		background-color: ${p => getGlobal('platform') === 'darwin' ? 'transparent' : p.theme.ui.background};
		

		color: ${p => p.theme.ui.textOnAction};
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
		color: ${p => p.theme.ui.textOnAction};

		> strong {
			font-weight: 600;
		}
	}

	::-webkit-scrollbar {
		width: 10px;
		height: 10px;
	}
	::-webkit-scrollbar-track {
		background: transparent;
	}
	::-webkit-scrollbar-thumb {
		background-color: ${p => p.theme.ui.secondaryAction}33;

		&:hover {
			background-color: ${p => p.theme.ui.secondaryAction};
		}
	}

	.titlebar {
		.menubar {
			.action-item {
				.action-label {
					color: ${p => p.theme.ui.textOnSurfaceBackground};
					font-size: 14px;
				}

				> .action-menu-item {
					height: 1.7rem;

					> .menu-item-icon {
						display: none;
					}
				}

				&.focused {
					background-color: ${p => p.theme.ui.secondaryAction};
				}
			}
		}

		.window-title {
			font-size: 12px;
			font-weight: 500;
			color: ${p => p.theme.ui.textOnSurfaceBackground};
		}
	}
`;

export {
	DesignSystemProvider,
	GlobalStyle,
};
