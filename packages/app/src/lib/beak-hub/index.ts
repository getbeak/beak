const path = window.require('electron').remote.require('path');

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
