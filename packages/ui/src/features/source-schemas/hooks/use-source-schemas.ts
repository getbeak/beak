import { projectTree } from '@beak/state';
import { useAppSelector } from '@beak/ui/store/redux';
import { useCallback, useEffect, useRef, useState } from 'react';
import { shallowEqual } from 'react-redux';

import { enumerateSourceSchemas } from '../lib/enumerate';
import type { SourceSchemaEntry, SourceSchemaKind } from '../types';

/**
 * Subscribe to the list of endpoints of a given kind in the current
 * project. Re-enumerates when the set of project folders changes.
 *
 * We deliberately *don't* depend on the whole tree — that would re-fire
 * the enumerator on every keystroke inside a request body (Immer hands
 * back a fresh tree reference on every request edit, even though no
 * folder structure changed). Subscribing to the folder list with
 * `shallowEqual` is enough: Immer preserves the reference of every
 * unchanged folder node, so a request-body edit yields a shallow-equal
 * folder array and the hook stays quiet.
 */
export function useSourceSchemas(kind: SourceSchemaKind) {
	const folders = useAppSelector(s => projectTree.filterByType(s.global.project.tree, 'folder'), shallowEqual);
	const [entries, setEntries] = useState<SourceSchemaEntry[]>([]);
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
			const next = await enumerateSourceSchemas(kind, folders);
			if (tag === seqRef.current) setEntries(next);
		} catch (error) {
			console.warn(`${kind} endpoint enumeration failed`, error);
			if (tag === seqRef.current) setEntries([]);
		} finally {
			if (tag === seqRef.current) setLoading(false);
		}
	}, [kind, folders]);

	useEffect(() => {
		void refresh();
	}, [refresh]);

	return { entries, loading, refresh };
}
