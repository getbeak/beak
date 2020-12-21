import { Color, Titlebar } from 'custom-electron-titlebar';
import { useEffect } from 'react';
import { useTheme } from 'styled-components';

import { getGlobal } from '../globals';

export default function useTitleBar() {
	const theme = useTheme();

	useEffect(() => {
		if (getGlobal('platform') === 'darwin')
			return;

		// eslint-disable-next-line no-new
		new Titlebar({
			icon: './images/logo.svg',
			backgroundColor: Color.fromHex(theme.ui.surface),
		});
	}, []);
}
