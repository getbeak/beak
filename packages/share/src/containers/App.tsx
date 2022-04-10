import React from 'react';

import Header from '../components/molecules/Header';
import useSmoothHashScroll from '../hooks/use-smooth-hash-scroll';

const AppContainer: React.FunctionComponent = ({ children }) => {
	useSmoothHashScroll();

	return (
		<React.Fragment>
			<Header />
			{children}
		</React.Fragment>
	);
};

export default AppContainer;
