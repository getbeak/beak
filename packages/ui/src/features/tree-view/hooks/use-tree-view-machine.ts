import { projectPanePreferenceSetCollapse } from '@beak/ui/store/preferences/actions';
import { useAppSelector } from '@beak/ui/store/redux';
import { type UseTreeViewReturn, useTreeView } from '@chakra-ui/react';
import type { TreeCollection } from '@zag-js/collection';
import { useMemo, useRef } from 'react';
import { useDispatch } from 'react-redux';

import type { BeakTreeNode } from './use-tree-collection';

interface UseTreeViewMachineArgs {
	collection: TreeCollection<BeakTreeNode>;
	activeNodeId?: string;
}

/**
 * Wraps Chakra's `useTreeView` and mirrors expansion state with the Redux
 * `projectPane.collapsed` preference. Multi-select is on by default; cmd /
 * shift click behavior comes from Zag's tree machine for free.
 *
 * Expansion is controlled (Redux is the source of truth) so a remote
 * `projectPanePreferenceSetCollapse` dispatch — say, a reveal-active command
 * expanding a chain of ancestors — flows back into the tree machine.
 */
export default function useTreeViewMachine({
	collection,
	activeNodeId,
}: UseTreeViewMachineArgs): UseTreeViewReturn<BeakTreeNode> {
	const dispatch = useDispatch();
	const collapsedMap = useAppSelector(s => s.global.preferences.projectPane.collapsed);

	const allBranchIds = useMemo(() => collection.getBranchValues(), [collection]);
	const expandedValue = useMemo(() => allBranchIds.filter(id => !collapsedMap[id]), [allBranchIds, collapsedMap]);
	const expandedRef = useRef(expandedValue);
	expandedRef.current = expandedValue;

	return useTreeView<BeakTreeNode>({
		collection,
		selectionMode: 'multiple',
		expandedValue,
		defaultFocusedValue: activeNodeId ?? null,
		onExpandedChange: details => {
			const before = new Set(expandedRef.current);
			const after = new Set(details.expandedValue);
			for (const id of allBranchIds) {
				const wasOpen = before.has(id);
				const isOpen = after.has(id);
				if (wasOpen === isOpen) continue;
				dispatch(projectPanePreferenceSetCollapse({ key: id, collapsed: !isOpen }));
			}
			expandedRef.current = details.expandedValue;
		},
	});
}
