import { ThemeMode } from '@beak/common/types/theme';
import { nativeTheme } from 'electron';

import getBeakHost from '../host';

// Do this to start
setupThemeMode();

nativeTheme.on('updated', async () => {
	const themeMode = await getBeakHost().providers.storage.get('themeMode');

	await setThemeMode(themeMode, false);
});

export async function setThemeMode(themeMode: ThemeMode, updateNative = true) {
	await getBeakHost().providers.storage.set('themeMode', themeMode);

	if (updateNative)
		nativeTheme.themeSource = themeMode;
}

async function setupThemeMode() {
	const themeMode = await getBeakHost().providers.storage.get('themeMode');

	await setThemeMode(themeMode);
}
