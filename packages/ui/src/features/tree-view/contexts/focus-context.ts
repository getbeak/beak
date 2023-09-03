import React, { createContext } from 'react';

interface Context {
	rootRef: React.MutableRefObject<HTMLElement | null>;
	activeNodeId?: string;
	focusedNodeId?: string;
	focusedNodeInvalidator?: string;
	setFocusedNodeId: (focusedNodeId: string) => void;
}

export const TreeViewFocusContext = createContext<Context>({
	rootRef: { current: null },
	setFocusedNodeId: () => { /* */ },
});
