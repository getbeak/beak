import {
	FolderNode,
	Nodes,
	ProjectFile,
	RequestNode,
	RequestNodeFile,
	Tree,
} from '@beak/common/types/beak-project';
import { FSWatcher } from 'chokidar';
import { validate } from 'jsonschema';

import { projectSchema, requestSchema } from './schemas';

const chokidar = window.require('electron').remote.require('chokidar');
const fs = window.require('electron').remote.require('fs-extra');
const path = window.require('electron').remote.require('path');

const forbiddenFiles = ['.DS_Store', 'Thumbs.db'];

interface ReadFolderNodeOptions {
	root: boolean;
	parent: string | null;
}

export interface ListenerEvent {
	type: 'add' | 'change' | 'unlink' | 'addDir' | 'unlinkDir';
	path: string;
	node: Nodes;
}

type Emitter = (message: ListenerEvent) => void;

export default class BeakProject {
	private _projectPath: string;
	private _project?: ProjectFile;
	private _tree: Tree = {};
	private _watcher?: FSWatcher;
	private _watcherReady = false;
	private _watcherEmitter?: Emitter;

	constructor(projectFilePath: string) {
		this._projectPath = path.join(projectFilePath, '..');
	}

	getProject() {
		return this._project;
	}

	getProjectPath() {
		return this._projectPath;
	}

	getTree() {
		return this._tree;
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

	async startWatching(emitter: Emitter) {
		this._watcherEmitter = emitter;
		this._watcher = chokidar.watch(this._projectPath, {
			followSymlinks: false,
		});

		this._watcher
			.on('add', path => this.recordListenerMessage({ type: 'add', path }))
			.on('change', path => this.recordListenerMessage({ type: 'change', path }))
			.on('unlink', path => this.recordListenerMessage({ type: 'unlink', path }))
			.on('addDir', path => this.recordListenerMessage({ type: 'addDir', path }))
			.on('unlinkDir', path => this.recordListenerMessage({ type: 'unlinkDir', path }))
			.on('ready', () => {
				this._watcherReady = true;
			});
	}

	stopWatching() {
		this._watcher?.close();

		this._watcherReady = false;
		this._watcher = void 0;
	}

	printTree() {
		console.log(this._tree);
	}

	async writeFolderNode(node: FolderNode) {
		throw new Error('nah not done yet lol soz');
	}

	async updateRequestNode(filePath: string) {
		const requestFile = await fs.readJson(filePath) as RequestNodeFile;
		const extension = path.extname(filePath);
		const name = path.basename(filePath, extension);

		validate(requestFile, requestSchema, { throwError: true });

		const node: Nodes = {
			type: 'request',
			filePath,
			parent: this._tree[requestFile.id].parent,
			name,
			id: requestFile.id,
			info: {
				verb: requestFile.verb,
				uri: requestFile.uri,
				headers: requestFile.headers,
				body: requestFile.body,
			},
		};

		// this._tree[node.id] = node;
		this._tree = {
			...this._tree,
			[node.id]: node,
		};

		return node;
	}

	async writeRequestNode(node: RequestNode) {
		const requestFile: RequestNodeFile = {
			id: node.id,
			verb: node.info.verb,
			uri: node.info.uri,
			headers: node.info.headers,
			body: node.info.body,
		};

		await fs.writeJson(node.filePath, requestFile, { spaces: '\t' });
	}

	private recordListenerMessage(message: Omit<ListenerEvent, 'node'>) {
		if (!this._watcherReady)
			return;

		if (message.type !== 'change') {
			console.log('only change events currently supported: ', message);

			return;
		}

		this.updateRequestNode(message.path).then(node => {
			this._watcherEmitter!({
				node,
				type: message.type,
				path: message.path,
			});
		});
	}

	private async readFolderNode(filePath: string, opts: ReadFolderNodeOptions) {
		const { root, parent } = opts;

		const node: FolderNode = {
			type: 'folder',
			name: path.basename(filePath),
			filePath,
			parent,
			children: [],
		};

		const items = await fs.readdir(filePath);
		const psParent = root === true ? null : node.filePath;

		/* eslint-disable no-await-in-loop */
		for (const item of items) {
			const fullPath = path.join(filePath, item);
			const stat = await fs.stat(fullPath);
			let out: Nodes | undefined = void 0;

			if (forbiddenFiles.includes(item))
				continue;

			if (stat.isDirectory()) {
				out = await this.readFolderNode(fullPath, { root: false, parent: psParent });

				node.children.push(out.filePath);
			} else if (stat.isFile()) {
				out = await this.readRequestNode(fullPath, psParent);

				node.children.push(out.id);
			} else {
				throw new Error('Unknown dir content type');
			}
		}
		/* eslint-disable no-await-in-loop */

		if (!root)
			this._tree[node.filePath] = node;

		return node;
	}

	private async readRequestNode(filePath: string, parent: string | null) {
		const requestFile = await fs.readJson(filePath) as RequestNodeFile;
		const extension = path.extname(filePath);
		const name = path.basename(filePath, extension);

		validate(requestFile, requestSchema, { throwError: true });

		const node: RequestNode = {
			type: 'request',
			filePath,
			parent,
			name,
			id: requestFile.id,
			info: {
				verb: requestFile.verb,
				uri: requestFile.uri,
				headers: requestFile.headers,
				body: requestFile.body,
			},
		};

		this._tree[node.id] = node;

		return node;
	}
}
