import { useEffect, useState } from 'react';

const STORAGE_KEY = 'beak.featureFlags.variableInputV2';

export function isVariableInputV2Enabled(): boolean {
	try {
		return window.localStorage.getItem(STORAGE_KEY) === 'true';
	} catch {
		return false;
	}
}

export function setVariableInputV2Enabled(enabled: boolean): void {
	try {
		window.localStorage.setItem(STORAGE_KEY, enabled ? 'true' : 'false');
		window.dispatchEvent(new CustomEvent('beak:feature-flag-changed', { detail: { key: STORAGE_KEY, enabled } }));
	} catch {
		/* localStorage unavailable, ignore */
	}
}

export function useVariableInputV2Flag(): [boolean, (enabled: boolean) => void] {
	const [enabled, setEnabled] = useState(isVariableInputV2Enabled);

	useEffect(() => {
		const onChange = (e: Event) => {
			const ce = e as CustomEvent<{ key: string; enabled: boolean }>;
			if (ce.detail?.key === STORAGE_KEY) setEnabled(ce.detail.enabled);
		};
		window.addEventListener('beak:feature-flag-changed', onChange);
		return () => window.removeEventListener('beak:feature-flag-changed', onChange);
	}, []);

	return [enabled, setVariableInputV2Enabled];
}
