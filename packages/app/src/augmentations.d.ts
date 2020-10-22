import electron, { Remote } from 'electron';
import process from 'process';
import { Store } from 'react-redux';
import url from 'url';

import { ApplicationState } from './store';

declare module 'electron' {
	interface Remote {
		require(moduleSpecifier: 'process'): typeof process;
		require(moduleSpecifier: 'url'): typeof url;
	}
}

declare global {
	interface Window {
		require(moduleSpecifier: 'electron'): typeof electron;

		store: Store<ApplicationState>;
	}
}

declare module 'react-redux' {
	interface DefaultRootState extends ApplicationState {}
}
