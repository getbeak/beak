import { createContext } from 'react';

interface Context {
	activeNodeId?: string;
}

export const TreeViewFocusContext = createContext<Context>({});
