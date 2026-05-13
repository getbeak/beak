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
		--rt-color-white: var(--beak-colors-gray-50);
		--rt-color-dark: var(--beak-colors-gray-900);
		--rt-opacity: 1;
	}
	.react-tooltip {
		border: 1px solid color-mix(in srgb, var(--beak-colors-accent-pink) 26%, var(--beak-colors-border-subtle)) !important;
		box-shadow: 0 8px 24px rgba(0,0,0,0.28), 0 4px 10px color-mix(in srgb, var(--beak-colors-accent-pink) 14%, transparent), inset 0 1px 0 color-mix(in srgb, white 14%, transparent) !important;
		backdrop-filter: blur(10px) saturate(160%) !important;
		font-size: 11px !important;
		font-weight: 500 !important;
		letter-spacing: 0.01em !important;
		padding: 5px 8px !important;
		max-width: 260px !important;
		animation: beakTooltipIn 0.14s ease-out both !important;
	}
	.react-tooltip-arrow {
		border-right: 1px solid color-mix(in srgb, var(--beak-colors-accent-pink) 26%, var(--beak-colors-border-subtle)) !important;
		border-bottom: 1px solid color-mix(in srgb, var(--beak-colors-accent-pink) 26%, var(--beak-colors-border-subtle)) !important;
	}
	${darwin ? 'html, body { background-color: transparent !important; }' : ''}
	@keyframes beakTooltipIn {
		0% { opacity: 0; transform: translateY(-3px) scale(.96); }
		100% { opacity: 1; transform: translateY(0) scale(1); }
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
