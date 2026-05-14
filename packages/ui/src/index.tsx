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
	@keyframes beakPortalSpin {
		to { transform: rotate(360deg); }
	}
	@keyframes beakSpin {
		from { transform: rotate(0deg); }
		to { transform: rotate(360deg); }
	}
	@keyframes beakLogoFloat {
		0%, 100% { transform: translateY(0); }
		50% { transform: translateY(-4px); }
	}
	@keyframes beakFlightOuter {
		0% { transform: scale(.55); opacity: 0.55; }
		70% { transform: scale(1.7); opacity: 0; }
		100% { transform: scale(1.7); opacity: 0; }
	}
	@keyframes beakFlightInner {
		0% { transform: scale(.7); opacity: 0.75; }
		70% { transform: scale(1.35); opacity: 0; }
		100% { transform: scale(1.35); opacity: 0; }
	}
	@keyframes beakProgressShimmer {
		0% { background-position: 0% 0; }
		100% { background-position: 300% 0; }
	}
	@keyframes beakNonprodPulse {
		0%, 100% { box-shadow: 0 8px 24px color-mix(in srgb, var(--beak-colors-accent-alert) 30%, transparent), inset 0 1px 0 color-mix(in srgb, white 18%, transparent); }
		50% { box-shadow: 0 8px 30px color-mix(in srgb, var(--beak-colors-accent-alert) 60%, transparent), inset 0 1px 0 color-mix(in srgb, white 22%, transparent); }
	}
	*::-webkit-scrollbar { width: 8px; height: 8px; }
	*::-webkit-scrollbar-track { background: transparent; }
	*::-webkit-scrollbar-thumb {
		background: color-mix(in srgb, var(--beak-colors-fg-muted) 22%, transparent);
		border-radius: 4px;
		border: 2px solid transparent;
		background-clip: padding-box;
	}
	*::-webkit-scrollbar-thumb:hover {
		background: color-mix(in srgb, var(--beak-colors-accent-pink) 60%, transparent);
		background-clip: padding-box;
	}
	*::-webkit-scrollbar-corner { background: transparent; }
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
