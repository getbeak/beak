import { BeakBase, Providers } from './base';
import BeakProject from './project';

export default class BeakHost extends BeakBase {
	private readonly beakProject: BeakProject;

	constructor(providers: Providers) {
		super(providers);

		this.beakProject = new BeakProject(this.providers);
	}

	get project() {
		return this.beakProject;
	}
}
