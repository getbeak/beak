import React from 'react';

import Welcome from './Welcome';

const App: React.FunctionComponent = () => {
	const params = new URLSearchParams(window.location.search);
	const container = params.get('container');

	switch (container) {
		case 'welcome':
			return <Welcome />;

		default:
			return <span>{'s'}</span>;
	}
};

export default App;
