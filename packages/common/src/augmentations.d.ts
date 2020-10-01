import childProcess from 'child_process';
import chokidar from 'chokidar';
import electron from 'electron';
import fsExtra from 'fs-extra';
import path from 'path';
import process from 'process';
import url from 'url';

declare global {
	interface Window {
		require(moduleSpecifier: 'child-process'): typeof childProcess;
		require(moduleSpecifier: 'chokidar'): typeof chokidar;
		require(moduleSpecifier: 'electron'): typeof electron;
		require(moduleSpecifier: 'fs-extra'): typeof fsExtra;
		require(moduleSpecifier: 'path'): typeof path;
		require(moduleSpecifier: 'process'): typeof process;
		require(moduleSpecifier: 'url'): typeof url;
	}
}
