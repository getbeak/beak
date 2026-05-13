import { createContext } from 'react';

import type { FlatNode } from '../hooks/use-flattened-tree';

interface FlatContext {
	flat: FlatNode[];
	indexById: Record<string, number>;
	scrollToIndex: (index: number) => void;
}

export const TreeViewFlatContext = createContext<FlatContext>({
	flat: [],
	indexById: {},
	scrollToIndex: () => {},
});
