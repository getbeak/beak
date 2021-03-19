import { DesignSystemProvider } from '@beak/design-system';
import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';

import { GlobalStyle } from './design-system';
// import { configureStore } from './store';

const FauxRouter: React.FunctionComponent = () => (
	<React.Fragment>
	{/* <Provider store={configureStore()}> */}
		<base href={'./'} />
		<DesignSystemProvider themeKey={'dark'}>
			<GlobalStyle />
			{'test'}
		</DesignSystemProvider>
	{/* </Provider> */}
	</React.Fragment>
);

ReactDOM.render(<FauxRouter />, document.getElementById('root'));
