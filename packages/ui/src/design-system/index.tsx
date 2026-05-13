import { createGlobalStyle } from 'styled-components';

interface GlobalStyleProps {
	$darwin: boolean;
}

/**
 * Renderer-wide globals that live OUTSIDE the Chakra theme.
 *
 * The Chakra theme owns most of what used to be in here (body font,
 * scrollbar, focus rings, etc. — see `packages/design-system/src/theme.ts`'s
 * `globalCss`). What remains here is:
 *
 *  - react-tooltip's `--rt-color-*` CSS vars (until the tooltip atom is
 *    migrated off react-tooltip)
 *  - the macOS vibrancy escape hatch — body background is `transparent`
 *    on darwin so the Electron BrowserWindow's vibrancy effect shows
 *    through. Non-darwin gets the canvas colour painted opaquely.
 *
 * All colour references resolve through Chakra's CSS variables now, so
 * this stylesheet no longer needs the styled-components ThemeProvider.
 */
const GlobalStyle = createGlobalStyle<GlobalStyleProps>`
	:root {
		--rt-color-white: var(--beak-colors-fg-default);
		--rt-color-dark: var(--beak-colors-bg-surface-alt);
		--rt-opacity: .9;
	}

	${p => p.$darwin && 'html, body { background-color: transparent !important; }'}

	body .react-tooltip {
		padding: 6px 8px;
		font-size: 13px;
		box-shadow: 0 8px 24px rgba(0, 0, 0, 0.27);
		z-index: 105;
	}
`;

export { GlobalStyle };
