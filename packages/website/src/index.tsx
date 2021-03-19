import { DesignSystemProvider } from '@beak/design-system';
import React from 'react';
import ReactDOM from 'react-dom';

import AppContainer from './containers/App';
import { GlobalStyle } from './design-system';
import Home from './features/home/components/Home';
// import { configureStore } from './store';

const EntryPoint: React.FunctionComponent = () => (
	<React.Fragment>
		{/* <Provider store={configureStore()}> */}
		<base href={'./'} />
		<DesignSystemProvider themeKey={'dark'}>
			<GlobalStyle />
			<AppContainer>
				<Home />
			</AppContainer>
		</DesignSystemProvider>
		{/* </Provider> */}
	</React.Fragment>
);

ReactDOM.render(<EntryPoint />, document.getElementById('root'));
