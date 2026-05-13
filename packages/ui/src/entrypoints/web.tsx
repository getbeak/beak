import React from 'react';
import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom';

import WebProjectMain from '../containers/WebProjectMain';

// The web host no longer has a welcome screen — `/` redirects to the
// default project route so the app boots straight into a workspace.
// (The web host resolves "default" to either a previously-open project or
// an untitled one via its own bootstrap pipeline.)
const router = createBrowserRouter([
	{
		path: '/',
		children: [
			{ path: '', element: <Navigate to='/project/default' replace /> },
			{ path: 'project/:projectId', element: <WebProjectMain /> },
		],
	},
]);

export const WebEntrypoint: React.FC = () => <RouterProvider router={router} />;
