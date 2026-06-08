import React, { useEffect } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';

import AgentPairReturn from '../containers/AgentPairReturn';
import WebProjectMain from '../containers/WebProjectMain';
import { setActiveProjectIdHint } from '../services/web-bridge';
import { discoverAgentRequested } from '../store/effects/agent';
import { useAppDispatch, useAppSelector } from '../store/redux';

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
	const activeProjectId = useAppSelector(state => state.global.project.id ?? null);

	useEffect(() => {
		dispatch(discoverAgentRequested());
	}, [dispatch]);

	// Reflect the active project id into sessionStorage so the web host's
	// IPC handlers can find it when the URL stays at `/` (memory mode).
	useEffect(() => {
		setActiveProjectIdHint(activeProjectId);
	}, [activeProjectId]);

	return <RouterProvider router={router} />;
};
