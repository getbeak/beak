import React from 'react';

import Header from '../components/molecules/Header';
import useSmoothHashScroll from '../hooks/use-smooth-hash-scroll';

const AppContainer: React.FunctionComponent<React.PropsWithChildren<unknown>> = ({ children }) => {
	useSmoothHashScroll();

	return (
		<React.Fragment>
			<Header />
			{children}
		</React.Fragment>
	);
};

export default AppContainer;
