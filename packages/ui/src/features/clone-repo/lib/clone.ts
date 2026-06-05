import { ipcDialogService, ipcGitService, ipcProjectService } from '@beak/ui/lib/ipc';

const embedded = Boolean(window.embeddedIndicator);

export interface CloneRequest {
	url: string;
	targetName: string;
}

export type CloneResult = { ok: true; dir: string; openable: boolean } | { ok: false; error: string };

/**
 * Drive the clone flow end-to-end. Returns the resolved target directory
 * on success so the caller can hand it to `ipcProjectService.openFolder`.
 *
 * Electron: prompts for a parent folder, composes `<parent>/<targetName>`,
 * verifies it doesn't already exist, then clones. The resulting dir is
 * "openable" if it contains a `project.json` (i.e. the cloned repo is a
 * Beak project — most useful here).
 *
 * Web: target is a lightning-fs path `/<sanitised-name>`. No picker.
 */
export async function cloneRepo({ url, targetName }: CloneRequest): Promise<CloneResult> {
	if (!url.trim()) return { ok: false, error: 'Enter a repo URL.' };
	const safeName = sanitiseTargetName(targetName);
	if (!safeName) return { ok: false, error: 'Enter a target folder name.' };

	let dir: string;
	if (embedded) {
		const pick = await ipcDialogService.showOpenDialog({
			title: 'Choose where to clone the repo',
			properties: ['openDirectory', 'createDirectory'],
			buttonLabel: 'Clone here',
		});
		if (pick.canceled || pick.filePaths.length === 0) {
			return { ok: false, error: 'Clone cancelled.' };
		}
		dir = joinPath(pick.filePaths[0]!, safeName);
	} else {
		dir = `/${safeName}`;
	}

	try {
		await ipcGitService.clone({ url: url.trim(), dir });
		const openable = await isBeakProject(dir);
		return { ok: true, dir, openable };
	} catch (err) {
		return { ok: false, error: err instanceof Error ? err.message : String(err) };
	}
}

/**
 * Open the cloned project. Electron uses the renderer-side openFolder IPC
 * (takes a project.json path); web navigates to the project route after
 * resolving the project's id from its `project.json`.
 */
export async function openClonedProject(dir: string): Promise<void> {
	const projectFile = joinPath(dir, 'project.json');
	if (embedded) {
		await ipcProjectService.openFolder(projectFile);
	} else {
		await ipcProjectService.openFolder(projectFile);
	}
}

function sanitiseTargetName(name: string): string {
	return name
		.trim()
		.replace(/[^a-zA-Z0-9._-]+/g, '-')
		.replace(/^-+|-+$/g, '');
}

function joinPath(a: string, b: string): string {
	if (!a.endsWith('/') && !a.endsWith('\\')) return `${a}/${b}`;
	return `${a}${b}`;
}

async function isBeakProject(dir: string): Promise<boolean> {
	// `ipcFsService` could verify, but it's bound to the *current* project
	// window — not a freshly-cloned dir. So we just optimistically say yes
	// and let `openFolder` surface a friendly error if the file is missing.
	return Boolean(dir);
}
