import { Theme } from '@beak/design-system/types';

export function ensureThemeIsValid(unsafeTheme?: string): Theme {
	if (!unsafeTheme) return 'dark';

	return ['light', 'dark'].includes(unsafeTheme) ? unsafeTheme as Theme : 'dark';
}
