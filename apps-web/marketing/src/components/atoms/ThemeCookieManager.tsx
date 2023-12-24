'use client';

import React, { useEffect, useState } from 'react';
import { DesignSystemProvider } from '@beak/design-system';
import { Theme } from '@beak/design-system/types';
import Cookies from 'js-cookie';

interface ThemeCookieManagerProps {
	serverKnewTheme: boolean;
	serverTheme: Theme;
}

export default function ThemeCookieManager(props: React.PropsWithChildren<ThemeCookieManagerProps>) {
	const { children, serverKnewTheme, serverTheme } = props;
	const [activeTheme, setActiveTheme] = useState<Theme>(() => serverTheme);

	function updateTheme(theme: Theme) {
		setActiveTheme(theme);
		Cookies.set('client_theme', theme);
	}

	useEffect(() => {
		window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', event => {
			updateTheme(event.matches ? 'dark' : 'light');
		});

		const activeSystemTheme = getActiveSystemTheme();

		if (serverKnewTheme && serverTheme === activeSystemTheme) return () => { /* */ };

		const interval = window.setInterval(() => setActiveTheme(activeSystemTheme), 500);

		return () => window.clearInterval(interval);
	}, []);

	return (
		<DesignSystemProvider themeKey={activeTheme}>
			{children}
		</DesignSystemProvider>
	);
}

function getActiveSystemTheme(): Theme {
	let theme: Theme = 'dark';

	if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches)
		theme = 'light';

	return theme;
}
