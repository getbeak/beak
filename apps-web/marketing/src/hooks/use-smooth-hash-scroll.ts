import { useEffect } from 'react';

export default function useSmoothHashScroll() {
	useEffect(() => {
		document.querySelectorAll('a[href^="#"]').forEach(anchor => {
			anchor.addEventListener('click', e => {
				const target = e.target as HTMLElement;
				const href = target?.getAttribute?.('href');

				if (!href)
					return;

				e.preventDefault();

				document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' });
			});
		});
	}, []);
}
