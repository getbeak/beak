import * as Electron from 'electron';
import * as FsExtra from 'fs-extra';
import * as Path from 'path';

// Don't like this, but have to as eslint doesn't understand interfaces, f
/* eslint-disable no-undef */

declare global {
	interface Window {
		require(moduleSpecifier: 'electron'): typeof Electron;
		require(moduleSpecifier: 'fs-extra'): typeof FsExtra;
		require(moduleSpecifier: 'path'): typeof Path;
	}
}
