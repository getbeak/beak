import remote from '@electron/remote';
import chokidar from 'chokidar';
import electron from 'electron';
import fsExtra from 'fs-extra';
import path from 'path';
import process from 'process';
import { Store } from 'react-redux';
import url from 'url';

import { ApplicationState } from './store';

// declare module '@electron/remote' {
// 	interface RequireMap {
// 		process: typeof process;
// 	}

// 	export var require: typeof Require;

// 	// function require(id: 'process'): typeof process;
// 	// function require(id: 'url'): typeof url;
// 	// function require(id: 'path'): typeof path;
// 	// function require(id: 'chokidar'): typeof chokidar;
// 	// function require(id: 'fs-extra'): typeof fsExtra;
// }

declare global {
	interface ElectronRemote {
		require(id: 'url'): typeof url;
		require(id: 'process'): typeof process;
		require(id: 'url'): typeof url;
		require(id: 'path'): typeof path;
		require(id: 'chokidar'): typeof chokidar;
		require(id: 'fs-extra'): typeof fsExtra;
	}

	interface Window {
		require(moduleSpecifier: 'electron'): typeof electron;
		require(moduleSpecifier: '@electron/remote'): typeof remote & ElectronRemote;

		store: Store<ApplicationState>;
	}
}

declare module 'react-redux' {
	interface DefaultRootState extends ApplicationState {}
}
