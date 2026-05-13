import { ChakraProvider } from '@chakra-ui/react';
import { ThemeProvider as NextThemesProvider } from 'next-themes';
import * as React from 'react';

import { system } from './theme';
import type { Theme } from './types';

interface BeakChakraProviderProps {
	/** Resolved theme key (`light` or `dark`). The renderer detects this from
	 *  the OS / user preference and feeds it in, and we forward it to
	 *  `next-themes` so Chakra's `_dark` semantic-token selectors light up. */
	themeKey: Theme;
	children?: React.ReactNode;
}

/**
 * The single provider Beak's renderer wraps itself in.
 *
 * Composition (outer to inner):
 *
 * 1. `next-themes` — owns the `class="dark"` / `class="light"` toggle on
 *    `<html>` so Chakra's `_dark` semantic-token selectors resolve.
 * 2. Chakra UI v3 `ChakraProvider` — supplies the design system
 *    (`packages/design-system/src/theme.ts`) to every descendant.
 *
 * No styled-components ThemeProvider here — every remaining
 * styled-component reads its colours via `var(--beak-colors-*)` CSS
 * variables that Chakra emits at the root.
 */
const BeakChakraProvider: React.FC<BeakChakraProviderProps> = ({ themeKey, children }) => (
	<NextThemesProvider
		attribute='class'
		defaultTheme={themeKey}
		forcedTheme={themeKey}
		enableSystem={false}
		disableTransitionOnChange
	>
		<ChakraProvider value={system}>{children}</ChakraProvider>
	</NextThemesProvider>
);

export { BeakChakraProvider };
