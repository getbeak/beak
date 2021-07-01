import remote from '@electron/remote';
import chokidar from 'chokidar';
import electron from 'electron';
import fsExtra from 'fs-extra';
import path from 'path';
import process from 'process';
import { Store } from 'react-redux';
import url from 'url';

import { ApplicationState } from './store';

declare global {
	interface ElectronRemote {
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
