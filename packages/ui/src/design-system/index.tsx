import { toHexAlpha } from '@beak/design-system/utils';
import { createGlobalStyle } from 'styled-components';

interface GlobalStyleProps {
	$darwin: boolean;
}

const GlobalStyle = createGlobalStyle<GlobalStyleProps>`
	:root {
		--rt-color-white: ${p => p.theme.ui.textOnSurfaceBackground};
		--rt-color-dark: ${p => p.theme.ui.surfaceHighlight};
		--rt-opacity: .9;
	}

	* {
		-webkit-font-smoothing: subpixel-antialiased;
	}

	html, body {
		font-family: ${p => p.theme.fonts.default};

		// This is needed for Vibrancy
		background-color: ${p => p.$darwin ? 'transparent' : p.theme.ui.background};

		color: ${p => p.theme.ui.textOnSurfaceBackground};
		margin: 0;
		padding: 0;

		overflow: hidden;
		-webkit-user-select: none;
	}

	input[type=text], input[type=number], select, input[type=email], article[contenteditable=true] {
		&:focus:not(:disabled) {
			outline: 0;
			border-color: ${p => p.theme.ui.primaryFill};
			box-shadow: 0 0 0 3px ${p => p.theme.ui.primaryFill}77;
			background: ${p => p.theme.ui.surfaceHighlight};
			border-radius: 4px;
		}

		&:disabled {
			cursor: text;
		}
	}

	body .react-tooltip {
		padding: 6px 8px;
		font-size: 13px;
		box-shadow: ${p => p.theme.ui.textOnSurfaceBackground}44 0px 8px 24px;
		z-index: 105;
	}

	::-webkit-scrollbar {
		width: 6px;
		height: 6px;
	}
	::-webkit-scrollbar-track {
		background: transparent;
	}
	::-webkit-scrollbar-thumb {
		background-color: ${p => toHexAlpha(p.theme.ui.secondaryAction, 0.1)};
		transition: background .1s ease;

		&:hover {
			background-color: ${p => p.theme.ui.secondaryAction};
		}
	}
	::-webkit-scrollbar-corner {
		background: transparent;
	}
`;

export {
	GlobalStyle,
};
