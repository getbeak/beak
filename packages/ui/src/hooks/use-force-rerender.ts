import { useCallback, useState } from 'react';

export default function useForceReRender(): [number, () => void] {
	const [latestForceRerender, setLatestForceRerender] = useState(0);

	const forceRerender = useCallback(() => {
		setLatestForceRerender(Date.now());
	}, []);

	return [latestForceRerender, forceRerender];
}
