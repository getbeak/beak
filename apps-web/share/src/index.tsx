import { BeakChakraProvider } from '@beak/design-system';
import * as Sentry from '@sentry/react';
import * as React from 'react';
import { lazy, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Route, Routes } from 'react-router-dom';

import Redirect from './components/atoms/Redirect';
import AppContainer from './containers/App';
import ErrorFallback from './features/errors/components/ErrorFallback';

const ShareProject = lazy(() => import('./features/share-project/components/ShareProject'));

// Tiny global styles — inlined as a `<style>` tag, resolved through Chakra
// CSS variables (`var(--beak-colors-*)`) so they pick up the active theme.
const GLOBAL_CSS = `
	body {
		font-family: 'Open Sans', sans-serif;
		background: var(--beak-colors-bg-canvas-alt);
		color: var(--beak-colors-fg-default);
		margin: 0; padding: 0;
	}
	a { color: var(--beak-colors-accent-pink); }
	a:hover { color: color-mix(in srgb, var(--beak-colors-accent-pink) 80%, white); }
	::selection {
		background-color: color-mix(in srgb, var(--beak-colors-accent-pink) 35%, transparent);
		color: var(--beak-colors-fg-default);
	}
`;

const EntryPoint: React.FC = () => (
	<React.Fragment>
		<base href='./' />
		<BeakChakraProvider themeKey='dark'>
			<style>{GLOBAL_CSS}</style>
			<BrowserRouter>
				<AppContainer>
					<Sentry.ErrorBoundary fallback={<ErrorFallback />}>
						<Suspense fallback={<div />}>
							<Routes>
								<Route path='/projects/:projectId' element={<ShareProject />} />
								<Route path='*' element={<Redirect />} />
							</Routes>
						</Suspense>
					</Sentry.ErrorBoundary>
				</AppContainer>
			</BrowserRouter>
		</BeakChakraProvider>
	</React.Fragment>
);

if (import.meta.env.MODE !== 'development') {
	Sentry.init({
		dsn: 'https://f70de5e39405453594ebd9d7712d113a@o988021.ingest.sentry.io/6320237',
		integrations: [],
		environment: import.meta.env.ENVIRONMENT,
		release: import.meta.env.RELEASE_IDENTIFIER,
		tracesSampleRate: 1.0,
	});
}

createRoot(document.getElementById('root')!).render(<EntryPoint />);
