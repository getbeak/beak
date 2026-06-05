import React, { useEffect } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';

import AgentPairReturn from '../containers/AgentPairReturn';
import WebProjectMain from '../containers/WebProjectMain';
import { discoverAgentRequested } from '../store/effects/agent';
import { useAppDispatch } from '../store/redux';

// `/` mounts the empty workbench (welcome tab, no project bootstrap).
// `/project/:projectId` mounts a bound project — same shell, full bootstrap.
// `/agent/pair/return` is the redirect target for the agent pairing flow.
// Mirrors the electron host's empty-vs-disk window distinction.
const router = createBrowserRouter([
	{
		path: '/',
		children: [
			{ path: '', element: <WebProjectMain /> },
			{ path: 'project/:projectId', element: <WebProjectMain /> },
			{ path: 'agent/pair/return', element: <AgentPairReturn /> },
		],
	},
]);

export const WebEntrypoint: React.FC = () => {
	const dispatch = useAppDispatch();
	useEffect(() => {
		dispatch(discoverAgentRequested());
	}, [dispatch]);

	return <RouterProvider router={router} />;
};
