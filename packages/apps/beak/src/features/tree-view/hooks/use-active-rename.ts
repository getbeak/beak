import { useContext } from 'react';
import { useAppSelector } from '@beak/app-beak/store/redux';

import { TreeViewAbstractionsContext } from '../contexts/abstractions-context';
import { ActiveRename, TreeViewItem } from '../types';

function shimRenameSelector() {
	return void 0;
}

export function useActiveRename(node: TreeViewItem): [ActiveRename | undefined, boolean] {
	const absContext = useContext(TreeViewAbstractionsContext);
	const renameSelector = absContext.renameSelector ?? shimRenameSelector;
	const activeRename = useAppSelector(s => renameSelector(node, s)) as ActiveRename | undefined;
	const renaming = Boolean(activeRename && activeRename?.id === node.id);

	return [activeRename, renaming];
}
