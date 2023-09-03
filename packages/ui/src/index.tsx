import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { Theme } from '@beak/common/types/theme';
import { DesignSystemProvider } from '@beak/design-system';

import './utils/unhandled-error-handler';
import NonprodBadge from './components/atoms/NonprodBadge';
import Tooltips from './components/molecules/Tooltips';
import WindowSessionContext, { instance } from './contexts/window-session-context';
import { GlobalStyle } from './design-system';
import { ElectronEntrypoint } from './entrypoints/electron';
import { WebEntrypoint } from './entrypoints/web';
import { configureStore } from './store';
import { setupMonaco } from './utils/monaco';

const store = configureStore();
const embedded = Boolean(window.embeddedIndicator);

setupMonaco();

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
		<Provider store={store}>
			<base href={'./'} />
			<WindowSessionContext.Provider value={instance}>
				<DesignSystemProvider themeKey={theme}>
					<GlobalStyle $darwin={instance.isDarwin()} />
					{embedded && <ElectronEntrypoint />}
					{!embedded && <WebEntrypoint />}
					<NonprodBadge />
					<Tooltips />
				</DesignSystemProvider>
			</WindowSessionContext.Provider>
		</Provider>
	);
};

createRoot(document.getElementById('root')!).render(<App />);
