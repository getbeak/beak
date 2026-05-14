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

	// Single-shot rerender right when the mandatory loading time elapses,
	// instead of polling at 10fps forever.
	useEffect(() => {
		if (!withinMandatoryLoadingTime) return;
		const remaining = Math.max(0, started + miniumLoadTime - Date.now());
		const id = window.setTimeout(forceRerender, remaining + 16);
		return () => window.clearTimeout(id);
	}, [withinMandatoryLoadingTime, started, forceRerender]);

	if (withinMandatoryLoadingTime) return true;

	return loading || settingUp;
}
