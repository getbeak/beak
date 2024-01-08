/* eslint-disable operator-linebreak */
import * as path from 'path';

// Is our app packaged in a binary or still in Electron?
export const appIsPackaged = !process.defaultApp;

/**
 * Get the path to the `static` folder.
 * This is a temporary hack, waiting for the 2 issues to be fixed.
 *
 * @see https://github.com/electron-userland/electron-webpack/issues/52
 * @see https://github.com/electron-userland/electron-webpack/issues/157
 */
const staticPath = appIsPackaged
	? path.join(__dirname.replace(/app\.asar$/, 'static'), 'ui', 'dist')
	: path.join(process.cwd(), 'static', 'ui', 'dist');

export { staticPath };
