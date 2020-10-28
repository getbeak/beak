import {
	FolderNode,
	Nodes,
	ProjectFile,
	RequestNode,
	RequestNodeFile,
	Tree,
} from '@beak/common/types/beak-project';
// @ts-ignore
import ksuid from '@cuvva/ksuid';
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

export type ListenerEvent = {
	type: 'add' | 'change' | 'addDir' | 'unlinkDir';
	path: string;
	node: Nodes;
} | {
	type: 'unlink';
	path: string;
}

type Emitter = (message: ListenerEvent) => void;

export default class BeakProject {
	private _projectPath: string;
	private _projectTreePath: string;
	private _project?: ProjectFile;
	private _tree: Tree = {};
	private _watcher?: FSWatcher;
	private _watcherReady = false;
	private _watcherEmitter?: Emitter;

	constructor(projectFilePath: string) {
		this._projectPath = path.join(projectFilePath, '..');
		this._projectTreePath = path.join(projectFilePath, '..', 'tree');
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
		await this.readFolderNode(this._projectTreePath, { root: true, parent: null });
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

	async createRequestNode(incomingId: string) {
		const parentFilePath = (() => {
			if (incomingId === 'root')
				return null;

			const node = this._tree![incomingId];

			if (node.type === 'folder')
				return node.filePath;

			const parentNode = this._tree![node.parent!];

			if (!parentNode)
				return null;

			return parentNode.filePath;
		})();

		const folderPath = parentFilePath ?? this._projectTreePath;
		const name = await generateRequestName('Example Request', folderPath);
		const newNode: RequestNodeFile = {
			id: ksuid.generate('request').toString(),
			verb: 'get',
			headers: {},
			uri: {
				protocol: 'https:',
				hostname: 'httpbin.org',
				port: '',
				pathname: '/anything',
				query: { },
				fragment: null,
			},
			body: {
				type: 'text',
				payload: '',
			},
		};

		await fs.writeJson(name, newNode);

		return newNode.id;
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

	async updateRequestNode(filePath: string) {
		const requestFile = await fs.readJson(filePath) as RequestNodeFile;
		const parentFolder = path.dirname(filePath);
		const extension = path.extname(filePath);
		const name = path.basename(filePath, extension);
		const parent = this._tree[parentFolder]?.filePath;

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

	async renameRequestNode(id: string, newName: string) {
		const request = this._tree[id] as RequestNode;
		const directory = path.dirname(request.filePath);
		const newFilePath = path.join(directory, `${newName}.json`);
		const oldFilePath = request.filePath;

		if (await fs.pathExists(newFilePath))
			throw new Error('Request name already exists');

		await this.writeRequestNode({
			...request,
			filePath: newFilePath,
		});
		await this.removeRequestNode(oldFilePath);
	}

	async removeRequestNode(filePath: string) {
		await fs.remove(filePath);
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

	async writeFolderNode(node: FolderNode) {
		throw new Error('nah not done yet lol soz');
	}

	private recordListenerMessage(message: Omit<ListenerEvent, 'node'>) {
		if (!this._watcherReady)
			return;

		if (['add', 'change'].includes(message.type)) {
			this.updateRequestNode(message.path).then(node => {
				this._watcherEmitter!({
					node,
					type: message.type,
					path: message.path,
				});
			});
		} else if (message.type === 'unlink') {
			this.removeRequestNode(message.path);
			this._watcherEmitter!({
				type: message.type,
				path: message.path,
			});
		} else {
			console.log('only add/change events currently supported: ', message);

			return;
		}
	}
}

async function generateRequestName(name: string, directory: string) {
	if (!await fs.pathExists(path.join(directory, `${name}.json`)))
		return name;
	
	let useableName = name;
	let index = 1;

	const matches = /^(.+) {1}\(([0-9]+)\)$/gm.exec(useableName);

	if (matches && matches.length === 3) {
		useableName = matches[1];
		index = Number(matches[2]) + 1;
	}

	// eslint-disable-next-line no-constant-condition
	while (true) {
		const full = path.join(directory, `${useableName} (${index}).json`);

		if (!await fs.pathExists(full))
			return full;

		index += 1;
	}
}
