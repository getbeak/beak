import { useCallback, useEffect } from 'react';

const useDebounce = (effect: () => void | Promise<void>, delay: number, deps: unknown[]) => {
	const callback = useCallback(effect, deps);

	useEffect(() => {
		const handler = setTimeout(() => {
			callback();
		}, delay);

		return () => void clearTimeout(handler);
	}, [callback, delay]);
};

export default useDebounce;
