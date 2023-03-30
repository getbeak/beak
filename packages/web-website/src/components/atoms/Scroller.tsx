import React, { useEffect } from 'react';

const Scroller: React.FC<React.PropsWithChildren<unknown>> = () => {
	const locationHash = typeof window === 'undefined' ? void 0 : window.location.hash;

	useEffect(() => {
		if (!locationHash)
			return;

		if (typeof window === 'undefined')
			return;

		// Hack to handle first page render
		window.setTimeout(() => {
			const element = document.getElementById(locationHash.slice(1));

			element?.scrollIntoView({ behavior: 'smooth' });
		}, 200);
	}, [locationHash]);

	return null;
};

export default Scroller;
