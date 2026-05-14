import { useCallback, useState } from 'react';

export default function useForceReRender(): [number, () => void] {
	const [latestForceRerender, setLatestForceRerender] = useState(0);

	// Increment a counter rather than writing Date.now() — back-to-back
	// calls within the same millisecond would have set the same value, and
	// React bails on identical state, silently dropping the rerender.
	const forceRerender = useCallback(() => {
		setLatestForceRerender(n => n + 1);
	}, []);

	return [latestForceRerender, forceRerender];
}
