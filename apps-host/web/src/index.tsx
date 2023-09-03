import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Theme } from '@beak/common/types/theme';
// import { GlobalStyle } from '@beak/design-system';
import { DesignSystemProvider } from '@beak/design-system';

import '@beak/ui';
import './ipc/services';

function getSystemTheme(): Theme {
	let theme: Theme = 'light';

	if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches)
		theme = 'dark';

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
			<DesignSystemProvider themeKey={theme}>
				{/* <GlobalStyle $darwin /> */}
			</DesignSystemProvider>
		</>
	);
};

createRoot(document.getElementById('root-host')!).render(<App />);
