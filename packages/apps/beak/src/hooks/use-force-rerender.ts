import { useState } from 'react';

export default function useForceReRender(): [number, () => void] {
	const [latestForceRerender, setLatestForceRerender] = useState(0);

	function forceRerender() {
		setLatestForceRerender(Date.now());
	}

	return [latestForceRerender, forceRerender];
}
