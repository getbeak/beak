import { validate } from 'jsonschema';

import { projectSchema } from './schemas';
import { FolderNode,Nodes, ProjectFile, RequestNode, RequestNodeFile } from './types';
import { FSWatcher } from 'chokidar';

const chokidar = window.require('chokidar');
const fs = window.require('fs-extra');
const path = window.require('path');

// TODO(afr): Check what is is for Linux (if they have one?)
const forbiddenFiles = ['.DS_Store', 'Thumbs.db'];

interface ReadFolderNodeOptions {
	root: boolean;
	parent: FolderNode | null;
}

export default class BeakProject {
	private _projectPath: string;
	private _project?: ProjectFile;
	private _tree: Nodes[] = [];
	private _watcher?: FSWatcher;
	private _watcherReady: boolean;

	constructor(projectFilePath: string) {
		this._projectPath = path.join(projectFilePath, '..');
	}

	async loadProject() {
		const projectFilePath = path.join(this._projectPath, 'project.json');
		const projectFile = await fs.readJson(projectFilePath) as ProjectFile;

		validate(projectFile, projectSchema, { throwError: true });

		this._project = projectFile;
	}

	// If you're wondering why I'm loading the tree, then launching chokidar and ignoring
	// the initial read through. It is because I am stupid and lazy xo
	async loadTree() {
		const treePath = path.join(this._projectPath, 'tree');

		await this.readFolderNode(treePath, { root: true, parent: null });
	}

	async startWatching() {
		this._watcher = chokidar.watch(this._projectPath, {
			followSymlinks: false,
		});

		this._watcher
			.on('add', path => this.eventStub('add', path))
			.on('change', path => this.eventStub('change', path))
			.on('unlink', path => this.eventStub('unlink', path))
			.on('addDir', path => this.eventStub('addDir', path))
			.on('unlinkDir', path => this.eventStub('unlinkDir', path))
			.on('ready', () => {
				this._watcherReady = true;
			});
	}

	async stopWatching() {
		await this._watcher?.close();

		this._watcherReady = false;
		this._watcher = void 0;
	}

	private eventStub(event: string, arg: string) {
		if (!this._watcherReady)
			return;

		console.log(`[${event}] => ${arg}`);
	}

	printTree() {
		console.log(this._tree);
	}

	private async readFolderNode(filePath: string, opts: ReadFolderNodeOptions) {
		const { root, parent } = opts;

		const node: FolderNode = {
			type: 'folder',
			filePath,
			parent,
			children: [],
		};

		const items = await fs.readdir(filePath);
		const psNode = root === true ? null : node;

		items.forEach(async item => {
			const fullPath = path.join(filePath, item);
			const stat = await fs.stat(fullPath);

			if (forbiddenFiles.includes(item))
				return;

			if (stat.isDirectory()) {
				const nd = await this.readFolderNode(fullPath, { root: false, parent: psNode });

				node.children.push(nd);
			} else if (stat.isFile()) {
				const nd = await this.readRequestNode(fullPath, psNode);

				node.children.push(nd);
			} else {
				throw new Error('Unknown dir content type');
			}
		});

		if (root !== true && node.parent === null)
			this._tree.push(node);

		return node;
	}

	private async readRequestNode(filePath: string, parent: FolderNode | null) {
		const node: RequestNode = {
			type: 'request',
			id: '#',
			filePath,
			parent,
		};

		const requestFile = await fs.readJson(filePath) as RequestNodeFile;

		validate(requestFile, projectSchema, { throwError: true });

		if (node.parent === null)
			this._tree.push(node);

		return node;
	}
}
