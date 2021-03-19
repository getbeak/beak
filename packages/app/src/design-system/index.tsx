import { createGlobalStyle } from 'styled-components';

import { getGlobal } from '../globals';
const GlobalStyle = createGlobalStyle`
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

	input[type=text], article[contenteditable=true] {
		&:focus {
			outline: 0;
			border-color: ${p => p.theme.ui.primaryFill};
			box-shadow: 0 0 0 3px ${p => p.theme.ui.primaryFill}AA;
			background: ${p => p.theme.ui.surfaceHighlight};
		}
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
		cursor: pointer;

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
	GlobalStyle,
};
