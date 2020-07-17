import chokidar from 'chokidar';
import electron from 'electron';
import fsExtra from 'fs-extra';
import path from 'path';
import { Store } from 'react-redux';

import { ApplicationState } from './store';

declare global {
	interface Window {
		// NOTE(afr): Need to move no-undef into typescript instead
		/* eslint-disable no-undef */
		require(moduleSpecifier: 'chokidar'): typeof chokidar;
		require(moduleSpecifier: 'electron'): typeof electron;
		require(moduleSpecifier: 'fs-extra'): typeof fsExtra;
		require(moduleSpecifier: 'path'): typeof path;
		/* eslint-enable no-undef */

		store: Store<ApplicationState>;
	}
}

declare module 'react-redux' {
	interface DefaultRootState extends ApplicationState {}
}
