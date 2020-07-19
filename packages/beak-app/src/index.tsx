import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';

import About from './containers/About';
import ProjectMain from './containers/ProjectMain';
import Welcome from './containers/Welcome';
import { DesignSystemProvider, GlobalStyle } from './design-system';
import { configureStore } from './store';

function getComponent(container: string | null) {
	switch (container) {
		case 'welcome':
			return <Welcome />;

		case 'about':
			return <About />;

		case 'project-main':
			return <ProjectMain />;

		default:
			return <span>{'unknown'}</span>;
	}
}

const FauxRouter: React.FunctionComponent = () => {
	const params = new URLSearchParams(window.location.search);
	const container = params.get('container');
	const component = getComponent(container);

	return (
		<Provider store={configureStore()}>
			<DesignSystemProvider themeKey={'dark'}>
				<GlobalStyle />
				{component}
			</DesignSystemProvider>
		</Provider>
	);
};

ReactDOM.render(<FauxRouter />, document.getElementById('root'));
