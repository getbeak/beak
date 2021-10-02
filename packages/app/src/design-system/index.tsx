import { createGlobalStyle } from 'styled-components';

interface GlobalStyleProps {
	$darwin: boolean;
}

const GlobalStyle = createGlobalStyle<GlobalStyleProps>`
	* {
		-webkit-font-smoothing: subpixel-antialiased;
	}

	html, body {
		font-family: ${p => p.theme.fonts.default};

		// This is needed for Vibrancy
		background-color: ${p => p.$darwin ? 'transparent' : p.theme.ui.background};

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
`;

export {
	GlobalStyle,
};
