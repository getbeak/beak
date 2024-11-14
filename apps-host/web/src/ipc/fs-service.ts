import {
	IpcFsServiceMain,
	MoveReq,
	ReadDirReq,
	ReadJsonReq,
	ReadTextReq,
	SimplePath,
	WriteJsonReq,
	WriteTextReq,
} from '@beak/common/ipc/fs';
import Squawk from '@beak/common/utils/squawk';

import getBeakHost from '../host';
import { fileOrFolderExists } from './fs-shared';
import { webIpcMain } from './ipc';
import { getCurrentProjectFolder } from './utils';

const service = new IpcFsServiceMain(webIpcMain);

service.registerReadJson(async (_event, payload: ReadJsonReq) => {
	const projectFolder = getCurrentProjectFolder();

	if (!projectFolder) return '';

	const filePath = await ensureWithinProject(projectFolder, payload.filePath);
	const fileJson = await getBeakHost().p.node.fs.promises.readFile(filePath, 'utf8');

	return JSON.parse(fileJson);
});

service.registerWriteJson(async (_event, payload: WriteJsonReq) => {
	const projectFolder = getCurrentProjectFolder();

	if (!projectFolder) return '';

	const filePath = await ensureWithinProject(projectFolder, payload.filePath);

	await ensureParentDirectoryExists(filePath);

	return await getBeakHost().p.node.fs.promises.writeFile(
		filePath,
		JSON.stringify(payload.content, null, '\t'),
		'utf8',
	);
});

service.registerReadText(async (_event, payload: ReadTextReq) => {
	const projectFolder = getCurrentProjectFolder();

	if (!projectFolder) return '';

	const filePath = await ensureWithinProject(projectFolder, payload.filePath);

	return await getBeakHost().p.node.fs.promises.readFile(filePath, 'utf8');
});

service.registerWriteText(async (_event, payload: WriteTextReq) => {
	const projectFolder = getCurrentProjectFolder();

	if (!projectFolder) return '';

	const filePath = await ensureWithinProject(projectFolder, payload.filePath);

	await ensureParentDirectoryExists(filePath);

	return await getBeakHost().p.node.fs.promises.writeFile(
		filePath,
		payload.content,
		'utf8',
	);
});

service.registerPathExists(async (_event, payload: SimplePath) => {
	const projectFolder = getCurrentProjectFolder();

	if (!projectFolder) return false;

	const filePath = await ensureWithinProject(projectFolder, payload.filePath);

	return fileOrFolderExists(filePath);
});

service.registerEnsureFile(async (_event, payload: SimplePath) => {
	const projectFolder = getCurrentProjectFolder();

	if (!projectFolder) return;

	const filePath = await ensureWithinProject(projectFolder, payload.filePath);

	await ensureParentDirectoryExists(filePath);
});

service.registerEnsureDir(async (_event, payload: SimplePath) => {
	const projectFolder = getCurrentProjectFolder();

	if (!projectFolder) return;

	const filePath = await ensureWithinProject(projectFolder, payload.filePath);

	await ensureParentDirectoryExists(filePath);
});

service.registerRemove(async (_event, payload: SimplePath) => {
	const projectFolder = getCurrentProjectFolder();

	if (!projectFolder) return;

	const filePath = await ensureWithinProject(projectFolder, payload.filePath);

	await getBeakHost().providers.node.fs.promises.rm(filePath);
});

service.registerMove(async (_event, payload: MoveReq) => {
	const projectFolder = getCurrentProjectFolder();

	if (!projectFolder) return;

	const srcPath = await ensureWithinProject(projectFolder, payload.srcPath);
	const dstPath = await ensureWithinProject(projectFolder, payload.dstPath);

	await getBeakHost().p.node.fs.promises.rename(srcPath, dstPath);
});

service.registerReadDir(async (_event, payload: ReadDirReq) => {
	const projectFolder = getCurrentProjectFolder();

	if (!projectFolder) return [];

	const filePath = await ensureWithinProject(projectFolder, payload.filePath);
	const directoryEntries = await getBeakHost().p.node.fs.promises.readdir(filePath, payload.options || void 0);
	const directoryEntriesStrings = directoryEntries as unknown as string[];

	return await Promise.all(directoryEntriesStrings.map(async de => {
		const fullPath = getBeakHost().p.node.path.join(filePath, de);
		let isDirectory = false;

		try {
			const res = await getBeakHost().p.node.fs.promises.stat(fullPath);

			isDirectory = res.isDirectory();
		} catch { /* */ }

		return {
			name: de,
			isDirectory,
		};
	}));
});

service.registerOpenReferenceFile(async _event =>
	// const sender = (event as IpcMainInvokeEvent).sender;
	// const window = BrowserWindow.fromWebContents(sender)!;

	// return await openReferenceFile(window);

	null,
);

service.registerPreviewReferencedFile(async (_event, _payload) =>
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

	const directoryIterations = parts.reduce<string[]>((acc, val, idx) => {
		const prevDirectory = acc[idx - 1] ?? '';

		if (!val) return acc;

		if (prevDirectory)
			acc.push(getBeakHost().p.node.path.join(prevDirectory, val));
		else
			acc.push(`/${val}`);

		return acc;
	}, []).filter(Boolean);

	for (const iteration of directoryIterations) {
		// eslint-disable-next-line no-await-in-loop
		if (!await fileOrFolderExists(iteration)) {
			// eslint-disable-next-line no-await-in-loop
			await getBeakHost().p.node.fs.promises.mkdir(iteration);
		}
	}
}

export async function ensureWithinProject(projectFolderPath: string, inputPath: string) {
	const projectFilePath = getBeakHost().p.node.path.join(projectFolderPath, 'project.json');
	const projectFile = await getBeakHost().project.readProjectFile(projectFolderPath);

	if (!projectFile)
		throw new Squawk('path_not_project', { projectFilePath });

	const projectDir = getBeakHost().p.node.path.join(projectFilePath, '..');
	const resolved = getBeakHost().p.node.path.resolve(getBeakHost().p.node.path.join(projectDir, inputPath));
	const isWithinProject = resolved.startsWith(projectDir) && getBeakHost().p.node.path.isAbsolute(resolved);

	if (!isWithinProject)
		throw new Squawk('path_not_within_project', { projectFilePath });

	return resolved;
}
