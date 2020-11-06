import { TypedObject } from '@beak/common/dist/helpers/typescript';
import { VariableGroup, VariableGroups } from '@beak/common/dist/types/beak-project';
import { FSWatcher } from 'fs-extra';
import { validate } from 'jsonschema';

import { Emitter } from '../beak-project';
import { variableGroupSchema } from './schema';

const chokidar = window.require('electron').remote.require('chokidar');
const fs = window.require('electron').remote.require('fs-extra');
const path = window.require('electron').remote.require('path');

const forbiddenFiles = ['.DS_Store', 'Thumbs.db'];

export default class BeakVariableGroup {
	private _projectPath: string;
	private _variableGroupPath: string;
	private _watcher?: FSWatcher;
	private _watcherReady = false;
	private _watcherEmitter?: Emitter;

	constructor(projectPath: string) {
		this._projectPath = projectPath;
		this._variableGroupPath = path.join(projectPath, 'variable-groups');
	}

	async load() {
		const items = await fs.readdir(this._variableGroupPath);
		const variableGroups: VariableGroups = { };

		/* eslint-disable no-await-in-loop */
		for (const item of items) {
			const fullPath = path.join(this._variableGroupPath, item);
			const stat = await fs.stat(fullPath);

			if (forbiddenFiles.includes(item))
				continue;

			if (!stat.isFile())
				continue;

			const ext = path.extname(fullPath);
			const name = path.basename(fullPath, ext);
			const variableGroup = await fs.readJson(fullPath);

			validate(variableGroup, variableGroupSchema, { throwError: true });

			variableGroups[name] = variableGroup as VariableGroup;
		}
		/* eslint-disable no-await-in-loop */

		return variableGroups;
	}

	async saveGroups(vgs: VariableGroups) {
		// TODO(afr): Move to doing a reconciliation here

		await Promise.all(TypedObject.keys(vgs).map(k => {
			const filePath = path.join(this._variableGroupPath, `${k}.json`);

			return fs.writeJson(filePath, vgs[k], { spaces: '\t' });
		}));
	}

	async startWatching(emitter: Emitter) {
		this._watcherEmitter = emitter;
		this._watcher = chokidar.watch(this._variableGroupPath, {
			followSymlinks: false,
		});

		this._watcher
			.on('ready', () => {
				this._watcherReady = true;
			});
	}

	stopWatching() {
		this._watcher?.close();

		this._watcherReady = false;
		this._watcher = void 0;
	}
}
