import chokidar from 'chokidar';
import electron, { Remote } from 'electron';
import fsExtra from 'fs-extra';
import process from 'process';
import { Store } from 'react-redux';
import url from 'url';

import { ApplicationState } from './store';

declare module 'electron' {
	interface Remote {
		require(moduleSpecifier: 'process'): typeof process;
		require(moduleSpecifier: 'url'): typeof url;
		require(moduleSpecifier: 'path'): typeof path;

		require(moduleSpecifier: 'chokidar'): typeof chokidar;
		require(moduleSpecifier: 'fs-extra'): typeof fsExtra;
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
