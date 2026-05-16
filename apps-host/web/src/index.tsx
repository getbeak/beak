import type { Theme } from '@beak/common/types/theme';
import { BeakChakraProvider } from '@beak/design-system';
import React from 'react';
import { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';

import '@beak/ui';
import './ipc/services';

function getSystemTheme(): Theme {
	let theme: Theme = 'light';

	if (window.matchMedia?.('(prefers-color-scheme: dark)').matches) theme = 'dark';

	return theme;
}

const App: React.FC = () => {
	const [theme, setTheme] = useState<Theme>(getSystemTheme());

	useEffect(() => {
		window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', event => {
			setTheme(event.matches ? 'dark' : 'light');
		});
	}, []);

	return (
		<>
			<base href={'./'} />
			<BeakChakraProvider themeKey={theme} />
		</>
	);
};

createRoot(document.getElementById('root-host')!).render(<App />);
