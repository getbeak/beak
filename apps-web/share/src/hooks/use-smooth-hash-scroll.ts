import { useEffect } from 'react';

export default function useSmoothHashScroll() {
	useEffect(() => {
		const anchors = Array.from(document.querySelectorAll<HTMLAnchorElement>('a[href^="#"]'));
		const handler = (e: Event) => {
			const anchor = e.currentTarget as HTMLAnchorElement;
			const href = anchor.getAttribute('href');
			if (!href) return;
			e.preventDefault();
			document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' });
		};
		for (const a of anchors) a.addEventListener('click', handler);
		return () => {
			for (const a of anchors) a.removeEventListener('click', handler);
		};
	}, []);
}
