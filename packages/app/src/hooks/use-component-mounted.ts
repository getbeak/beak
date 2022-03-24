import { useEffect, useRef } from 'react';

export default function useComponentMounted() {
	const mounted = useRef(true);

	useEffect(() => () => {
		mounted.current = false;
	}, []);

	return mounted.current;
}
