import { useEffect, useState } from 'react';

import useForceReRender from './use-force-rerender';

const miniumLoadTime = 2500;

export function useProjectLoading(loaded: boolean, setup: boolean) {
	const [, forceRerender] = useForceReRender();
	const [started] = useState(() => Date.now());
	const now = Date.now();
	const loading = !loaded;
	const settingUp = !setup;
	const withinMandatoryLoadingTime = now < started + miniumLoadTime;

	useEffect(() => {
		const interval = window.setInterval(() => forceRerender(), 100);

		return () => window.clearInterval(interval);
	}, []);

	if (withinMandatoryLoadingTime)
		return true;

	return loading || settingUp;
}
