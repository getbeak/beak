import { ChakraProvider } from '@chakra-ui/react';
import { ThemeProvider as NextThemesProvider } from 'next-themes';
import * as React from 'react';
import { ThemeProvider as StyledComponentsThemeProvider } from 'styled-components';

import fonts from './fonts';
import { system } from './theme';
import { createUiColors } from './themes';
import type { DesignSystem, Theme } from './types';

function createDesignSystem(themeKey: Theme): DesignSystem {
	return {
		theme: themeKey,
		ui: createUiColors(themeKey),
		fonts,
	};
}

interface BeakChakraProviderProps {
	/** Resolved theme key (`light` or `dark`). The renderer detects this from
	 *  the OS / user preference and feeds it in so the legacy styled-components
	 *  layer can still resolve `p.theme.ui.*` while migration is in progress. */
	themeKey: Theme;
	children: React.ReactNode;
}

/**
 * The single provider Beak's renderer wraps itself in.
 *
 * Composition (outer to inner):
 *
 * 1. `next-themes` — owns the `class="dark"` / `class="light"` toggle on
 *    `<html>` so Chakra's `_dark` semantic-token selectors light up.
 * 2. Chakra UI v3 `ChakraProvider` — provides the new design system
 *    (`packages/design-system/src/theme.ts`) to any descendants.
 * 3. styled-components `ThemeProvider` — compatibility shim for every
 *    component that hasn't been migrated off styled-components yet. It
 *    will be removed in Phase G once the migration is complete.
 *
 * The `themeKey` prop is the resolved (light|dark) value. We hand it to
 * styled-components for the compat shim AND seed `next-themes` with it
 * via `forcedTheme` so Chakra immediately reflects the same mode.
 */
const BeakChakraProvider: React.FC<BeakChakraProviderProps> = ({ themeKey, children }) => (
	<NextThemesProvider
		attribute='class'
		defaultTheme={themeKey}
		forcedTheme={themeKey}
		enableSystem={false}
		disableTransitionOnChange
	>
		<ChakraProvider value={system}>
			<StyledComponentsThemeProvider theme={createDesignSystem(themeKey)}>
				{children}
			</StyledComponentsThemeProvider>
		</ChakraProvider>
	</NextThemesProvider>
);

export { BeakChakraProvider };
