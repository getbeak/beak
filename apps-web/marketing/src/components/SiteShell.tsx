import React from 'react';
import { useEffect } from 'react';

import Footer from '../features/footer/Footer';
import { Providers } from '../theme/Providers';
import Navbar from './Navbar';

function useSmoothHashScroll() {
	useEffect(() => {
		const handlers: Array<[Element, EventListener]> = [];

		document.querySelectorAll('a[href^="#"]').forEach(anchor => {
			const handler: EventListener = e => {
				const href = (e.target as HTMLElement)?.getAttribute?.('href');
				if (!href) return;

				e.preventDefault();
				document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' });
			};

			anchor.addEventListener('click', handler);
			handlers.push([anchor, handler]);
		});

		return () => {
			handlers.forEach(([anchor, handler]) => {
				anchor.removeEventListener('click', handler);
			});
		};
	}, []);
}

function useScrollToInitialHash() {
	useEffect(() => {
		const hash = window.location.hash;
		if (!hash) return;

		window.setTimeout(() => {
			document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: 'smooth' });
		}, 200);
	}, []);
}

const SiteShell: React.FC<React.PropsWithChildren> = ({ children }) => {
	useSmoothHashScroll();
	useScrollToInitialHash();

	return (
		<Providers>
			<Navbar />
			{children}
			<Footer />
		</Providers>
	);
};

export default SiteShell;
