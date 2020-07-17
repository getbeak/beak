import * as Electron from 'electron';
import * as FsExtra from 'fs-extra';
import * as Path from 'path';
import { Store } from 'react-redux';

import { ApplicationState } from './store';

declare global {
	interface Window {
		/* eslint-disable no-undef */
		require(moduleSpecifier: 'electron'): typeof Electron;
		require(moduleSpecifier: 'fs-extra'): typeof FsExtra;
		require(moduleSpecifier: 'path'): typeof Path;
		/* eslint-enable no-undef */

		store: Store<ApplicationState>;
	}
}

declare module 'react-redux' {
	interface DefaultRootState extends ApplicationState {}
}
