import type { ThemeMode } from '@beak/common/types/theme';
import { nativeTheme } from 'electron';

import getBeakHost from '../host';

// Do this to start
setupThemeMode();

nativeTheme.on('updated', async () => {
	const themeMode = await getBeakHost().providers.preferences.getThemeMode();

	await setThemeMode(themeMode, false);
});

export async function setThemeMode(themeMode: ThemeMode, updateNative = true) {
	// Delegate persistence + renderer multicast to the PreferencesStore adapter.
	await getBeakHost().providers.preferences.setThemeMode(themeMode);

	if (updateNative) nativeTheme.themeSource = themeMode;
}

async function setupThemeMode() {
	const themeMode = await getBeakHost().providers.preferences.getThemeMode();

	await setThemeMode(themeMode);
}
