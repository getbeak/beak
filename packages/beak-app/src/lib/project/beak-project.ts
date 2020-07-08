import { remote } from 'electron';
remote.require('fs');

interface CreateOptions {
	path: string;
	name: string;
}

export default class BeakProject {
	static async create(options: CreateOptions): Promise<BeakProject> {
		return new BeakProject();
	}

	// static async load(path: string): Promise<BeakProject> {


	// 	return new BeakProject();
	// }
}
