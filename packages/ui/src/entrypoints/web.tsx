import React from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';

import WebProjectMain from '../containers/WebProjectMain';

// `/` mounts the empty workbench (welcome tab, no project bootstrap).
// `/project/:projectId` mounts a bound project — same shell, full bootstrap.
// Mirrors the electron host's empty-vs-disk window distinction.
const router = createBrowserRouter([
	{
		path: '/',
		children: [
			{ path: '', element: <WebProjectMain /> },
			{ path: 'project/:projectId', element: <WebProjectMain /> },
		],
	},
]);

export const WebEntrypoint: React.FC = () => <RouterProvider router={router} />;
