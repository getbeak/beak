import React from 'react';

import About from './About';
import Welcome from './Welcome';

const App: React.FunctionComponent = () => {
	const params = new URLSearchParams(window.location.search);
	const container = params.get('container');

	switch (container) {
		case 'welcome':
			return <Welcome />;

		case 'about':
			return <About />;

		default:
			return <span>{'unknown'}</span>;
	}
};

export default App;
