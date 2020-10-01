// NOTE(afr): Huge caviet here, I fucking hate this. no. every bad. but i'm tired and I
// can't be fucked to do properly. maybe soon.

import BeakProject from './project';

let project: BeakProject;

export function getProjectSingleton() {
	return project;
}

export function setProjectSingleton(bp: /* we're sooooorry */ BeakProject) {
	project = bp;
}
