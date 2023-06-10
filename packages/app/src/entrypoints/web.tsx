import React from 'react';
import {
	createBrowserRouter,
	RouterProvider,
} from 'react-router-dom';

import WebWelcome from '../containers/WebWelcome';

const router = createBrowserRouter([{
	path: '/',
	element: <WebWelcome />,
	children: [],
}]);

export const WebEntrypoint: React.FC = () => <RouterProvider router={router} />;
