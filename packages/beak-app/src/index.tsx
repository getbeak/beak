import React from 'react';
import ReactDOM from 'react-dom';

import App from './containers/App';
import { DesignSystemProvider, GlobalStyle } from './design-system';

const Home = () => (
	<DesignSystemProvider themeKey={'dark'}>
		<GlobalStyle />
		<App />
	</DesignSystemProvider>
);

ReactDOM.render(<Home />, document.getElementById('root'));
