import { DesignSystemProvider } from '@beak/design-system';
import { ConnectedRouter } from 'connected-react-router';
import { createBrowserHistory } from 'history';
import React, { lazy, Suspense } from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import { Route, Switch } from 'react-router';

import AppContainer from './containers/App';
import { GlobalStyle } from './design-system';
import { configureStore } from './store';

const history = createBrowserHistory();
const store = configureStore(history);

const Home = lazy(() => import('./features/home/components/Home'));

const EntryPoint: React.FunctionComponent = () => (
	<Provider store={store}>
		<ConnectedRouter history={history}>
			<base href={'./'} />
			<DesignSystemProvider themeKey={'dark'}>
				<GlobalStyle />
				<AppContainer>
					<Suspense fallback={<div>{'Loading...'}</div>}>
						<Switch>
							<Route exact path={'/'}>
								<Home />
							</Route>
							<Route exact path={'/pricing'}>
								{'todo'}
							</Route>
							<Route exact path={'/purchase/complete'}>
								{'todo'}
							</Route>
							<Route>
								{'404'}
							</Route>
						</Switch>
					</Suspense>
				</AppContainer>
			</DesignSystemProvider>
		</ConnectedRouter>
	</Provider>
);

ReactDOM.render(<EntryPoint />, document.getElementById('root'));
