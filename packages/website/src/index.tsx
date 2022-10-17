import React, { lazy, Suspense, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { DesignSystemProvider } from '@beak/design-system';
import { Theme } from '@beak/design-system/types';
import * as Sentry from '@sentry/react';
import { Integrations } from '@sentry/tracing';

import Scroller from './components/atoms/Scroller';
import AppContainer from './containers/App';
import { GlobalStyle } from './design-system';
import ErrorFallback from './features/errors/components/ErrorFallback';
import NotFound from './features/errors/components/NotFound';
import { configureStore } from './store';

const store = configureStore();

const Home = lazy(() => import('./features/home/components/Home'));
const Pricing = lazy(() => import('./features/pricing/components/Pricing'));
const Privacy = lazy(() => import('./features/legal/components/Privacy'));
const Purchased = lazy(() => import('./features/purchased/components/Purchased'));
const Terms = lazy(() => import('./features/legal/components/Terms'));

function getSystemTheme(): Theme {
	let theme: Theme = 'light';

	if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches)
		theme = 'dark';

	return theme;
}

const EntryPoint: React.FC<React.PropsWithChildren<unknown>> = () => {
	const [theme, setTheme] = useState<Theme>(getSystemTheme());

	useEffect(() => {
		window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', event => {
			setTheme(event.matches ? 'dark' : 'light');
		});
	}, []);

	return (
		<Provider store={store}>
			<base href={'./'} />
			<DesignSystemProvider themeKey={theme}>
				<GlobalStyle />
				<BrowserRouter>
					<AppContainer>
						<Sentry.ErrorBoundary fallback={<ErrorFallback />}>
							<Scroller />
							<Suspense fallback={<div />}>
								<Routes>
									<Route path={'/'} element={<Home />} />
									<Route path={'/pricing'} element={<Pricing />} />
									<Route path={'/legal/privacy'} element={<Privacy />} />
									<Route path={'/purchased'} element={<Purchased />} />
									<Route path={'/legal/terms'} element={<Terms />} />
									<Route path={'/purchase/complete'} element={'welcome!!'} />

									<Route path={'/privacy'} element={<Navigate to={'/legal/privacy'} replace />} />
									<Route path={'/terms'} element={<Navigate to={'/legal/terms'} replace />} />

									<Route path={'*'} element={<NotFound />} />
								</Routes>
							</Suspense>
						</Sentry.ErrorBoundary>
					</AppContainer>
				</BrowserRouter>
			</DesignSystemProvider>
		</Provider>
	);
};

if (import.meta.env.MODE !== 'development') {
	Sentry.init({
		dsn: 'https://8b49a1bc9c164490bbd0d7e564c92794@o988021.ingest.sentry.io/5948027',
		integrations: [new Integrations.BrowserTracing()],
		environment: import.meta.env.ENVIRONMENT,
		release: import.meta.env.RELEASE_IDENTIFIER,

		tracesSampleRate: 1.0,
	});
}

createRoot(document.getElementById('root')!).render(<EntryPoint />);
