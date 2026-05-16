import { useAppSelector } from '@beak/ui/store/redux';
import { useCallback, useEffect, useRef, useState } from 'react';

import { enumerateEndpoints } from '../lib/enumerate';
import type { EndpointEntry, EndpointKind } from '../types';

/**
 * Subscribe to the list of endpoints of a given kind in the current
 * project. Re-enumerates when the tree changes. Returns entries, a
 * manual refresh callback, and a loading flag for the initial paint.
 */
export function useEndpoints(kind: EndpointKind) {
	const tree = useAppSelector(s => s.global.project.tree);
	const [entries, setEntries] = useState<EndpointEntry[]>([]);
	const [loading, setLoading] = useState(false);
	// Guard against stale enumerations resolving out-of-order (e.g. user
	// clicks Refresh twice rapidly) by tagging each call with a sequence
	// number and ignoring results whose tag is no longer the latest.
	const seqRef = useRef(0);

	const refresh = useCallback(async () => {
		seqRef.current += 1;
		const tag = seqRef.current;
		setLoading(true);
		try {
			const next = await enumerateEndpoints(kind, tree);
			if (tag === seqRef.current) setEntries(next);
		} catch (error) {
			console.warn(`${kind} endpoint enumeration failed`, error);
			if (tag === seqRef.current) setEntries([]);
		} finally {
			if (tag === seqRef.current) setLoading(false);
		}
	}, [kind, tree]);

	useEffect(() => {
		void refresh();
	}, [refresh]);

	return { entries, loading, refresh };
}
