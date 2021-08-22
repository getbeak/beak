import { DesignSystemProvider } from '@beak/design-system';
import { ConnectedRouter } from 'connected-react-router';
import { createBrowserHistory } from 'history';
import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import { Route, Switch } from 'react-router';

import AppContainer from './containers/App';
import { GlobalStyle } from './design-system';
import Home from './features/home/components/Home';
import { configureStore } from './store';

const history = createBrowserHistory();
const store = configureStore(history);

const EntryPoint: React.FunctionComponent = () => (
	<Provider store={store}>
		<ConnectedRouter history={history}>
			<base href={'./'} />
			<DesignSystemProvider themeKey={'dark'}>
				<GlobalStyle />
				<AppContainer>
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
				</AppContainer>
			</DesignSystemProvider>
		</ConnectedRouter>
	</Provider>
);

ReactDOM.render(<EntryPoint />, document.getElementById('root'));
