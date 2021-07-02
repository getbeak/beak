import { DesignSystemProvider } from '@beak/design-system';
import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';

import About from './containers/About';
import Onboarding from './containers/Onboarding';
import ProjectMain from './containers/ProjectMain';
import Welcome from './containers/Welcome';
import { GlobalStyle } from './design-system';
import Arbiter from './features/arbiter/components/Arbiter';
import { setGlobal } from './globals';
import { configureStore } from './store';

function getComponent(container: string | null) {
	switch (container) {
		case 'welcome':
			return <Welcome />;

		case 'about':
			return <About />;

		case 'project-main':
			return <ProjectMain />;

		case 'onboarding':
			return <Onboarding />;

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
			<base href={'./'} />
			<DesignSystemProvider themeKey={'dark'}>
				<GlobalStyle />
				{container === 'onboarding' && component}
				{container !== 'onboarding' && (
					<Arbiter>
						{component}
					</Arbiter>
				)}
			</DesignSystemProvider>
		</Provider>
	);
};

const params = new URLSearchParams(window.location.search);

setGlobal('windowId', params.get('windowId'));
setGlobal('version', params.get('version'));
setGlobal('platform', params.get('platform'));

ReactDOM.render(<FauxRouter />, document.getElementById('root'));
