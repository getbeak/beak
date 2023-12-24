'use client';

import React, { useEffect } from 'react';

const Scroller: React.FC<React.PropsWithChildren<unknown>> = () => {
	const hash = typeof window === 'undefined' ? '' : window.location.hash;

	useEffect(() => {
		if (!hash)
			return;

		// Hack to handle first page render
		window.setTimeout(() => {
			const element = document.getElementById(hash.slice(1));

			element?.scrollIntoView({ behavior: 'smooth' });
		}, 200);
	}, [hash]);

	return null;
};

export default Scroller;
