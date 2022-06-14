import { ThemeMode } from '@beak/common/types/theme';
import { nativeTheme } from 'electron';

import persistentStore from './persistent-store';

// Do this to start
setupThemeMode();

nativeTheme.on('updated', async () => {
	const themeMode = persistentStore.get('themeMode');

	await setThemeMode(themeMode, false);
});

export async function setThemeMode(themeMode: ThemeMode, updateNative = true) {
	persistentStore.set('themeMode', themeMode);

	if (updateNative)
		nativeTheme.themeSource = themeMode;
}

async function setupThemeMode() {
	const themeMode = persistentStore.get('themeMode');

	await setThemeMode(themeMode);
}
