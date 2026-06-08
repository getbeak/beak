import {
	IpcFsServiceMain,
	type MoveReq,
	type ReadDirReq,
	type ReadJsonReq,
	type ReadTextReq,
	type SimplePath,
	type WriteJsonReq,
	type WriteTextReq,
} from '@beak/common/ipc/fs';
import Squawk from '@beak/common/utils/squawk';

import getBeakHost from '../host';
import { fileOrFolderExists } from './fs-shared';
import { webIpcMain } from './ipc';
import { getCurrentProjectFolder } from './utils';

const service = new IpcFsServiceMain(webIpcMain);

// Memory-mode projects on the web don't have a `project.json` on OPFS yet —
// `ensureWithinProject` throws `path_not_project` for them. Reads return safe
// defaults so the renderer can still load preferences / discover that nothing
// exists, and writes silently swallow because there's no disk identity to
// persist to until the user runs "Save Project As…".
function isMissingProjectError(error: unknown): boolean {
	return error instanceof Squawk && error.code === 'path_not_project';
}

service.registerReadJson(async (_event, payload: ReadJsonReq) => {
	const projectFolder = getCurrentProjectFolder();

	if (!projectFolder) return '';

	try {
		const filePath = await ensureWithinProject(projectFolder, payload.filePath);
		const fileJson = await getBeakHost().p.node.fs.promises.readFile(filePath, 'utf8');

		return JSON.parse(fileJson);
	} catch (error) {
		if (isMissingProjectError(error)) return '';
		throw error;
	}
});

service.registerWriteJson(async (_event, payload: WriteJsonReq) => {
	const projectFolder = getCurrentProjectFolder();

	if (!projectFolder) return '';

	try {
		const filePath = await ensureWithinProject(projectFolder, payload.filePath);

		await ensureParentDirectoryExists(filePath);

		return await getBeakHost().p.node.fs.promises.writeFile(
			filePath,
			JSON.stringify(payload.content, null, '\t'),
			'utf8',
		);
	} catch (error) {
		if (isMissingProjectError(error)) return '';
		throw error;
	}
});

service.registerReadText(async (_event, payload: ReadTextReq) => {
	const projectFolder = getCurrentProjectFolder();

	if (!projectFolder) return '';

	try {
		const filePath = await ensureWithinProject(projectFolder, payload.filePath);

		return await getBeakHost().p.node.fs.promises.readFile(filePath, 'utf8');
	} catch (error) {
		if (isMissingProjectError(error)) return '';
		throw error;
	}
});

service.registerWriteText(async (_event, payload: WriteTextReq) => {
	const projectFolder = getCurrentProjectFolder();

	if (!projectFolder) return '';

	try {
		const filePath = await ensureWithinProject(projectFolder, payload.filePath);

		await ensureParentDirectoryExists(filePath);

		return await getBeakHost().p.node.fs.promises.writeFile(filePath, payload.content, 'utf8');
	} catch (error) {
		if (isMissingProjectError(error)) return '';
		throw error;
	}
});

service.registerPathExists(async (_event, payload: SimplePath) => {
	const projectFolder = getCurrentProjectFolder();

	if (!projectFolder) return false;

	try {
		const filePath = await ensureWithinProject(projectFolder, payload.filePath);

		return fileOrFolderExists(filePath);
	} catch (error) {
		if (isMissingProjectError(error)) return false;
		throw error;
	}
});

service.registerEnsureFile(async (_event, payload: SimplePath) => {
	const projectFolder = getCurrentProjectFolder();

	if (!projectFolder) return;

	try {
		const filePath = await ensureWithinProject(projectFolder, payload.filePath);

		await ensureParentDirectoryExists(filePath);
	} catch (error) {
		if (isMissingProjectError(error)) return;
		throw error;
	}
});

service.registerEnsureDir(async (_event, payload: SimplePath) => {
	const projectFolder = getCurrentProjectFolder();

	if (!projectFolder) return;

	try {
		const filePath = await ensureWithinProject(projectFolder, payload.filePath);

		await ensureParentDirectoryExists(filePath);
	} catch (error) {
		if (isMissingProjectError(error)) return;
		throw error;
	}
});

service.registerRemove(async (_event, payload: SimplePath) => {
	const projectFolder = getCurrentProjectFolder();

	if (!projectFolder) return;

	try {
		const filePath = await ensureWithinProject(projectFolder, payload.filePath);

		// User-facing "delete" — match the electron handler's `shell.trashItem`
		// semantics by recursing into folders and tolerating already-gone paths.
		await getBeakHost().providers.node.fs.promises.rm(filePath, { recursive: true, force: true });
	} catch (error) {
		if (isMissingProjectError(error)) return;
		throw error;
	}
});

service.registerMove(async (_event, payload: MoveReq) => {
	const projectFolder = getCurrentProjectFolder();

	if (!projectFolder) return;

	try {
		const srcPath = await ensureWithinProject(projectFolder, payload.srcPath);
		const dstPath = await ensureWithinProject(projectFolder, payload.dstPath);

		await getBeakHost().p.node.fs.promises.rename(srcPath, dstPath);
	} catch (error) {
		if (isMissingProjectError(error)) return;
		throw error;
	}
});

service.registerReadDir(async (_event, payload: ReadDirReq) => {
	const projectFolder = getCurrentProjectFolder();

	if (!projectFolder) return [];

	let filePath: string;
	try {
		filePath = await ensureWithinProject(projectFolder, payload.filePath);
	} catch (error) {
		if (isMissingProjectError(error)) return [];
		throw error;
	}
	// lightning-fs partially supports the node fs.promises.readdir API but
	// its `withFileTypes` handling returns `[name, stat]` tuples in some
	// versions, which then break the downstream `path.join(dir, name)` call
	// (the second arg is the tuple, not a string). We always want plain
	// string filenames here — the loop below stat-checks each entry for
	// `isDirectory` regardless — so we explicitly drop the caller's options
	// and pass `undefined`.
	const directoryEntries = (await getBeakHost().p.node.fs.promises.readdir(filePath)) as unknown as Array<
		string | [string, unknown]
	>;

	return await Promise.all(
		directoryEntries.map(async de => {
			// Defensive unwrap: if a future lightning-fs version hands back
			// `[name, stat]` tuples regardless, take the first element rather
			// than crashing path.join.
			const name = Array.isArray(de) ? (de[0] as string) : de;
			const fullPath = getBeakHost().p.node.path.join(filePath, name);
			let isDirectory = false;

			try {
				const res = await getBeakHost().p.node.fs.promises.stat(fullPath);

				isDirectory = res.isDirectory();
			} catch {
				/* */
			}

			return {
				name,
				isDirectory,
			};
		}),
	);
});

service.registerOpenReferenceFile(
	async _event =>
		// const sender = (event as IpcMainInvokeEvent).sender;
		// const window = BrowserWindow.fromWebContents(sender)!;

		// return await openReferenceFile(window);

		null,
);

service.registerPreviewReferencedFile(
	async (_event, _payload) =>
		// const sender = (event as IpcMainInvokeEvent).sender;
		// const window = BrowserWindow.fromWebContents(sender)!;
		// const filePath = await previewReferencedFile(window, payload.fileReferenceId);

		// if (!filePath) return null;
		// if (!await fs.pathExists(filePath)) return null;

		// const stat = await fs.stat(filePath);

		// return {
		// 	filePath,
		// 	fileName: path.basename(filePath),
		// 	fileExtension: path.extname(filePath),
		// 	fileSize: stat.size,
		// };

		null,
);

service.registerReadReferencedFile(async (_event, _payload) =>
	// const sender = (event as IpcMainInvokeEvent).sender;
	// const window = BrowserWindow.fromWebContents(sender)!;
	// const filePath = await previewReferencedFile(window, payload.fileReferenceId);

	// const file = await fs.readFile(filePath);

	// if (payload.truncatedLength === void 0)
	// 	return { body: file.slice(0, payload.truncatedLength) };

	// return { body: file };

	({ body: new Uint8Array() }),
);

async function ensureParentDirectoryExists(filePath: string) {
	const parentDirectory = getBeakHost().p.node.path.dirname(filePath);
	const parts = parentDirectory.split('/').filter(Boolean);

	const directoryIterations = parts
		.reduce<string[]>((acc, val, idx) => {
			const prevDirectory = acc[idx - 1] ?? '';

			if (!val) return acc;

			if (prevDirectory) acc.push(getBeakHost().p.node.path.join(prevDirectory, val));
			else acc.push(`/${val}`);

			return acc;
		}, [])
		.filter(Boolean);

	for (const iteration of directoryIterations) {
		if (!(await fileOrFolderExists(iteration))) {
			await getBeakHost().p.node.fs.promises.mkdir(iteration);
		}
	}
}

/**
 * Thin proxy into the unified `Runtime.fs.ensureWithinProject` — both
 * hosts share one safety surface. The previous local implementation
 * used `startsWith(projectDir)` which let sibling paths sharing a name
 * prefix through (`/p/Cool` matched `/p/Cool-evil/...`); the runtime
 * helper uses safe path-segment boundary matching.
 */
export async function ensureWithinProject(projectFolderPath: string, inputPath: string) {
	return getBeakHost().fs.ensureWithinProject(projectFolderPath, inputPath);
}
