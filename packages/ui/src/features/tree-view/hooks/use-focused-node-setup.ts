import { useCallback, useState } from 'react';

type ReturnType = [string | undefined, string, (nodeId: string) => void];

export default function useFocusedNodeSetup(defaultNodeId: string | undefined): ReturnType {
	const [focusedNodeId, setFocusedNodeId] = useState(defaultNodeId);
	const [invalidator, setInvalidator] = useState(new Date().toISOString());

	const setFocusedNodeIdProxy = useCallback((nodeId: string) => {
		setFocusedNodeId(nodeId);
		setInvalidator(new Date().toISOString());
	}, []);

	return [focusedNodeId, invalidator, setFocusedNodeIdProxy];
}
