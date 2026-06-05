import type { Theme, ThemeMode } from '@beak/common/types/theme';
import { BeakChakraProvider } from '@beak/design-system';
import type { IpcRendererEvent } from 'electron';
import * as React from 'react';
import { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';

import './utils/unhandled-error-handler';
import NonprodBadge from './components/atoms/NonprodBadge';
import ContextMenuHost from './components/molecules/ContextMenuHost';
import ErrorBoundary from './components/molecules/ErrorBoundary';
import Tooltips from './components/molecules/Tooltips';
import { KeyboardStateProvider } from './contexts/keyboard-state-context';
import WindowSessionContext, { instance } from './contexts/window-session-context';
import { ElectronEntrypoint } from './entrypoints/electron';
import { WebEntrypoint } from './entrypoints/web';
import { ipcPreferencesService } from './lib/ipc';
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
	${darwin ? 'html, body { background-color: transparent !important; }' : ''}
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
	@media (prefers-reduced-motion: reduce) {
		*, *::before, *::after {
			animation-duration: 0.01ms !important;
			animation-iteration-count: 1 !important;
			transition-duration: 0.01ms !important;
			scroll-behavior: auto !important;
		}
	}
`;

const App: React.FC = () => {
	const [systemTheme, setSystemTheme] = useState<Theme>(getSystemTheme());
	const [mode, setMode] = useState<ThemeMode>('system');

	useEffect(() => {
		const query = window.matchMedia('(prefers-color-scheme: dark)');
		const onChange = (event: MediaQueryListEvent) => {
			setSystemTheme(event.matches ? 'dark' : 'light');
		};
		query.addEventListener('change', onChange);
		return () => query.removeEventListener('change', onChange);
	}, []);

	useEffect(() => {
		let cancelled = false;
		ipcPreferencesService.getThemeMode().then(stored => {
			if (!cancelled && stored) setMode(stored);
		});

		const listener = (_event: IpcRendererEvent, next: ThemeMode) => setMode(next);
		window.secureBridge.ipc.on('theme_mode_updated', listener);
		return () => {
			cancelled = true;
			window.secureBridge.ipc.off('theme_mode_updated', listener);
		};
	}, []);

	const theme: Theme = mode === 'system' ? systemTheme : mode;

	return (
		<Provider store={store}>
			<base href='./' />
			<WindowSessionContext.Provider value={instance}>
				<KeyboardStateProvider>
					<BeakChakraProvider themeKey={theme}>
						<style>{GLOBAL_CSS(instance.isDarwin())}</style>
						<ErrorBoundary variant='full' label='Beak'>
							{embedded && <ElectronEntrypoint />}
							{!embedded && <WebEntrypoint />}
						</ErrorBoundary>
						<NonprodBadge />
						<Tooltips />
						<ContextMenuHost />
					</BeakChakraProvider>
				</KeyboardStateProvider>
			</WindowSessionContext.Provider>
		</Provider>
	);
};

createRoot(document.getElementById('root')!).render(<App />);
