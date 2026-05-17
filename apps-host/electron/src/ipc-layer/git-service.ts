import getRuntime from '@beak/apps-host-electron/host';
import { IpcGitServiceMain } from '@beak/common/ipc/git';
import { registerGitBindings } from '@beak/runtime-shared';
import { type IpcMainInvokeEvent, ipcMain } from 'electron';

import { getProjectFolder } from './utils';

/**
 * Electron-side bindings for the Git IPC channel. The handler bodies are
 * identical to the web host's — both delegate to `Runtime.git` after
 * rewriting `dir` to the open project's folder — so the registration
 * loop lives in `@beak/runtime-shared/git/bindings`. Both hosts call it
 * with their own service instance + event-to-folder resolver.
 *
 * The renderer's `dir` field is ignored for project-bound ops (the
 * payload just needs to satisfy the schema). `clone` is the exception
 * — it writes to an arbitrary new path supplied by the caller.
 */
const service = new IpcGitServiceMain(ipcMain);

registerGitBindings<IpcMainInvokeEvent>(service, getRuntime().git, {
	resolveProjectDir: event => getProjectFolder(event),
});
