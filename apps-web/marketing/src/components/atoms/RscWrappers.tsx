'use client';

import React from 'react';
import { Provider } from 'react-redux';
import { configureStore } from '@beak/apps-web-marketing/store';

export const ClientProvider: React.FC<React.PropsWithChildren<unknown>> = ({ children }) => (
	<Provider store={configureStore()}>{children}</Provider>
);
