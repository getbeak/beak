import React, { useEffect } from 'react';
import { useLocation } from 'react-router';

const Scroller: React.FunctionComponent = () => {
	const location = useLocation();

	useEffect(() => {
		if (!location.hash)
			return;

		// Hack to handle first page render
		window.setTimeout(() => {
			const element = document.getElementById(location.hash.slice(1));

			element?.scrollIntoView({ behavior: 'smooth' });
		}, 200);
	}, [location.hash]);

	return null;
};

export default Scroller;
