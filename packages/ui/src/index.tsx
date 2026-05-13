import type { Theme } from '@beak/common/types/theme';
import { DesignSystemProvider } from '@beak/design-system';
import * as React from 'react';
import { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';

import './utils/unhandled-error-handler';
import NonprodBadge from './components/atoms/NonprodBadge';
import Tooltips from './components/molecules/Tooltips';
import WindowSessionContext, { instance } from './contexts/window-session-context';
import { ElectronEntrypoint } from './entrypoints/electron';
import { WebEntrypoint } from './entrypoints/web';
import { configureStore } from './store';
import { setupMonaco } from './utils/monaco';

const store = configureStore();
const embedded = Boolean(window.embeddedIndicator);

setupMonaco();

function getSystemTheme(): Theme {
	let theme: Theme = 'light';
	if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) theme = 'dark';
	return theme;
}

const GLOBAL_CSS = (darwin: boolean) => `
	:root {
		--rt-color-white: var(--beak-colors-fg-default);
		--rt-color-dark: var(--beak-colors-bg-surface-alt);
		--rt-opacity: .9;
	}
	${darwin ? 'html, body { background-color: transparent !important; }' : ''}
	body .react-tooltip {
		padding: 6px 8px;
		font-size: 13px;
		box-shadow: 0 8px 24px rgba(0, 0, 0, 0.27);
		z-index: 105;
	}
`;

const App: React.FC = () => {
	const [theme, setTheme] = useState<Theme>(getSystemTheme());

	useEffect(() => {
		window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', event => {
			setTheme(event.matches ? 'dark' : 'light');
		});
	}, []);

	return (
		<Provider store={store}>
			<base href='./' />
			<WindowSessionContext.Provider value={instance}>
				<DesignSystemProvider themeKey={theme}>
					<style>{GLOBAL_CSS(instance.isDarwin())}</style>
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
