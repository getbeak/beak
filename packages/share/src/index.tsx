import React, { lazy, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { DesignSystemProvider } from '@beak/design-system';
import * as Sentry from '@sentry/react';
import { Integrations } from '@sentry/tracing';

import Redirect from './components/atoms/Redirect';
import AppContainer from './containers/App';
import { GlobalStyle } from './design-system';
import ErrorFallback from './features/errors/components/ErrorFallback';

const ShareProject = lazy(() => import('./features/share-project/components/ShareProject'));

const EntryPoint: React.FC<React.PropsWithChildren<unknown>> = () => (
	<React.Fragment>
		<base href={'./'} />
		<DesignSystemProvider themeKey={'dark'}>
			<GlobalStyle />
			<BrowserRouter>
				<AppContainer>
					{/* @ts-expect-error - Temporary Fix */}
					<Sentry.ErrorBoundary fallback={<ErrorFallback />}>
						<Suspense fallback={<div />}>
							<Routes>
								<Route path={'/projects/:projectId'} element={<ShareProject />} />

								<Route path={'*'} element={<Redirect />} />
							</Routes>
						</Suspense>
					</Sentry.ErrorBoundary>
				</AppContainer>
			</BrowserRouter>
		</DesignSystemProvider>
	</React.Fragment>
);

Sentry.init({
	dsn: 'https://f70de5e39405453594ebd9d7712d113a@o988021.ingest.sentry.io/6320237',
	integrations: [new Integrations.BrowserTracing()],

	tracesSampleRate: 1.0,
});

createRoot(document.getElementById('root')!).render(<EntryPoint />);
