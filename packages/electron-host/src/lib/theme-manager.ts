import { Theme, ThemeMode } from '@beak/common/types/theme';
import { nativeTheme } from 'electron';

import { windowStack } from '../window-management';
import persistentStore from './persistent-store';

nativeTheme.on('updated', () => {
	// const themeMode = persistentStore.get('themeMode');
	// const systemThemeIsDark

	// if (themeMode !== 'system')
	// 	return;

	// broadcastThemeChange(theme);
});

export async function setThemeMode(themeMode: ThemeMode) {
	persistentStore.set('themeMode', themeMode);

	let theme: Theme = 'dark';

	if (themeMode === 'system') {
		const systemEnforcingDark = nativeTheme.shouldUseDarkColors;

		theme = systemEnforcingDark ? 'dark' : 'light';
	} else {
		theme = themeMode;
	}

	nativeTheme.themeSource = theme;

	broadcastThemeChange(theme);
}

async function broadcastThemeChange(theme: Theme) {
	Object.values(windowStack).forEach(w => {
		if (w.isDestroyed()) return;

		w.webContents.send('theme-broadcast', theme);
	});
}
