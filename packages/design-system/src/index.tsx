import * as React from 'react';
import { ThemeProvider } from 'styled-components';

import fonts from './fonts';
import { createUiColors } from './themes';
import { DesignSystem, Theme } from './types';

function createDesignSystem(themeKey: Theme): DesignSystem {
	return {
		theme: themeKey,
		ui: createUiColors(themeKey),

		fonts,
	};
}

// eslint-disable-next-line max-len
const DesignSystemProvider: React.FC<React.PropsWithChildren<{ themeKey: Theme }>> = ({ children, themeKey }) => (
	<ThemeProvider theme={createDesignSystem(themeKey)}>{children}</ThemeProvider>
);

export { DesignSystemProvider };
