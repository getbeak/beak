import { useAppSelector } from '@beak/ui/store/redux';
import { useCallback, useEffect, useRef, useState } from 'react';

import { enumerateGraphqlEndpoints, type GraphqlEndpointEntry } from '../lib/enumerate';

/**
 * Subscribe to the list of GraphQL-source collections in the current
 * project. Re-enumerates when the tree changes or the project folder
 * swaps. Returns the entries, a manual refresh hook, and a loading flag
 * so the sidebar can show a subtle shimmer on first paint.
 */
export function useGraphqlEndpoints() {
	const tree = useAppSelector(s => s.global.project.tree);
	const folderPath = useAppSelector(s => s.global.project.folderPath);
	const [entries, setEntries] = useState<GraphqlEndpointEntry[]>([]);
	const [loading, setLoading] = useState(false);
	// Guard against stale enumerations resolving out-of-order (e.g. user
	// clicks Refresh twice rapidly) by tagging each call with a sequence
	// number and ignoring results whose tag is no longer the latest.
	const seqRef = useRef(0);

	const refresh = useCallback(async () => {
		if (!folderPath) {
			setEntries([]);
			return;
		}
		seqRef.current += 1;
		const tag = seqRef.current;
		setLoading(true);
		try {
			const next = await enumerateGraphqlEndpoints(tree, folderPath);
			if (tag === seqRef.current) setEntries(next);
		} catch (error) {
			console.warn('graphql endpoint enumeration failed', error);
			if (tag === seqRef.current) setEntries([]);
		} finally {
			if (tag === seqRef.current) setLoading(false);
		}
	}, [tree, folderPath]);

	useEffect(() => {
		void refresh();
	}, [refresh]);

	return { entries, loading, refresh };
}
