import { createContext } from 'react';

interface Context {
	activeNodeId?: string;
	focusedNodeId?: string;
	focusedNodeInvalidator?: string;
	setFocusedNodeId: (focusedNodeId: string) => void;
}

export const TreeViewFocusContext = createContext<Context>({
	setFocusedNodeId: () => { /* */ },
});
