import { DesignSystemProvider } from '@beak/design-system';
import * as Sentry from '@sentry/react';
import { Integrations } from '@sentry/tracing';
import { ConnectedRouter } from 'connected-react-router';
import { createBrowserHistory } from 'history';
import React, { lazy, Suspense } from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import { Route, Switch } from 'react-router';

import AppContainer from './containers/App';
import { GlobalStyle } from './design-system';
import ErrorFallback from './features/errors/components/ErrorFallback';
import { configureStore } from './store';

const history = createBrowserHistory();
const store = configureStore(history);

const Home = lazy(() => import('./features/home/components/Home'));
const Pricing = lazy(() => import('./features/pricing/components/Pricing'));
const Privacy = lazy(() => import('./features/legal/components/Privacy'));
const Terms = lazy(() => import('./features/legal/components/Terms'));

const EntryPoint: React.FunctionComponent = () => (
	<Provider store={store}>
		<ConnectedRouter history={history}>
			<base href={'./'} />
			<DesignSystemProvider themeKey={'dark'}>
				<GlobalStyle />
				<AppContainer>
					<Sentry.ErrorBoundary fallback={<ErrorFallback />}>
						<Suspense fallback={<div />}>
							<Switch>
								<Route exact path={'/'}>
									<Home />
								</Route>
								<Route exact path={'/pricing'}>
									<Pricing />
								</Route>
								<Route exact path={'/privacy'}>
									<Privacy />
								</Route>
								<Route exact path={'/terms'}>
									<Terms />
								</Route>
								<Route exact path={'/purchase/complete'}>
									{'welcome!!'}
								</Route>
								<Route>
									{'y u here'}
								</Route>
							</Switch>
						</Suspense>
					</Sentry.ErrorBoundary>
				</AppContainer>
			</DesignSystemProvider>
		</ConnectedRouter>
	</Provider>
);

Sentry.init({
	dsn: 'https://8b49a1bc9c164490bbd0d7e564c92794@o988021.ingest.sentry.io/5948027',
	integrations: [new Integrations.BrowserTracing()],

	tracesSampleRate: 1.0,
});

ReactDOM.render(<EntryPoint />, document.getElementById('root'));
