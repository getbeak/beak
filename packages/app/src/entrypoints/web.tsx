import React from 'react';
import {
	createBrowserRouter,
	RouterProvider,
} from 'react-router-dom';

import WebProjectMain from '../containers/WebProjectMain';
import WebWelcome from '../containers/WebWelcome';

const router = createBrowserRouter([{
	path: '/',
	// errorElement: <RedirectToHome />,
	children: [
		{ path: '', element: <WebWelcome /> },
		{ path: 'project/:projectId', element: <WebProjectMain /> },
	],
}]);

export const WebEntrypoint: React.FC = () => <RouterProvider router={router} />;
