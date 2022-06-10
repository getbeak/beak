import { Theme, ThemeMode } from '@beak/common/types/theme';
import { nativeTheme } from 'electron';

import { windowStack } from '../window-management';
import persistentStore from './persistent-store';

// Do this to start
setupThemeMode();

nativeTheme.on('updated', () => {
	const themeMode = persistentStore.get('themeMode');

	setThemeMode(themeMode);
});

export async function setThemeMode(themeMode: ThemeMode) {
	persistentStore.set('themeMode', themeMode);
	nativeTheme.themeSource = themeMode;

	let theme: Theme = 'dark';

	if (themeMode === 'system') {
		const systemEnforcingDark = nativeTheme.shouldUseDarkColors;

		theme = systemEnforcingDark ? 'dark' : 'light';
	} else {
		theme = themeMode;
	}

	broadcastThemeChange(theme);
}

async function setupThemeMode() {
	const themeMode = persistentStore.get('themeMode');

	await setThemeMode(themeMode);
}

async function broadcastThemeChange(theme: Theme) {
	Object.values(windowStack).forEach(w => {
		if (w.isDestroyed()) return;

		w.webContents.send('theme-broadcast', theme);
	});
}
