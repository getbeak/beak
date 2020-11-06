// NOTE(afr): Huge caviet here, I fucking hate this. no. every bad. but i'm tired and I
// can't be fucked to do properly. maybe soon.

import BeakVariableGroup from '.';

let variableGroup: BeakVariableGroup;

export function getVariableGroupSingleton() {
	return variableGroup;
}

export function setVariableGroupSingleton(bp: /* we're sooooorry */ BeakVariableGroup) {
	variableGroup = bp;
}
