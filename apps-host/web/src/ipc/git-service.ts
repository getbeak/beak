import { IpcGitServiceMain } from '@beak/common/ipc/git';
import Squawk from '@beak/common/utils/squawk';
import { registerGitBindings } from '@beak/runtime-shared';

import getBeakHost from '../host';
import { webIpcMain } from './ipc';
import { getCurrentProjectFolder } from './utils';

/**
 * Web-side Git handlers. The handler bodies were identical to the
 * electron host's — both rewrite `dir` to the open project folder and
 * delegate to `Runtime.git` — so the loop lives in
 * `@beak/runtime-shared/git/bindings`. `dir` is a lightning-fs path
 * (typically `/<project-id>`).
 *
 * The renderer's `dir` field is ignored for project-bound ops. `clone`
 * is the exception — the renderer-supplied `dir` is the destination of
 * the new working tree.
 */
const service = new IpcGitServiceMain(webIpcMain);

registerGitBindings<unknown>(service, getBeakHost().git, {
	resolveProjectDir: () => {
		const dir = getCurrentProjectFolder();
		if (!dir) throw new Squawk('no_project_loaded', {});
		return dir;
	},
});
