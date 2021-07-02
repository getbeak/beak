import path from 'path-browserify';

export default class BeakHub {
	private projectPath: string;
	private hubPath: string;

	constructor(projectPath: string) {
		this.projectPath = projectPath;
		this.hubPath = path.join(projectPath, '.beak');
	}

	getHubPath() {
		return this.hubPath;
	}
}
