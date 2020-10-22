import chokidar from 'chokidar';
import electron from 'electron';
import fsExtra from 'fs-extra';
import path from 'path';

declare module 'electron' {
	interface Remote {
		require(moduleSpecifier: 'chokidar'): typeof chokidar;
		require(moduleSpecifier: 'fs-extra'): typeof fsExtra;
		require(moduleSpecifier: 'path'): typeof path;
	}
}

declare global {
	interface Window {
		require(moduleSpecifier: 'electron'): typeof electron;
	}
}
