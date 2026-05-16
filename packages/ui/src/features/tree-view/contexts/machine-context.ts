import type { UseTreeViewReturn } from '@chakra-ui/react';
import { createContext } from 'react';

import type { BeakTreeNode } from '../hooks/use-tree-collection';

/**
 * Surfaces the Zag tree-view api to descendants (renamer, drag handler,
 * external commands) that need to drive focus / selection / expansion
 * without bouncing through Redux every time.
 */
export const TreeViewMachineContext = createContext<UseTreeViewReturn<BeakTreeNode> | null>(null);
