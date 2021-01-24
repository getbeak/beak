import { RealtimeValueImplementation } from './types';
import variableGroupItem from './variable-group-item';

const realtimeImplementations: Record<string, RealtimeValueImplementation<any>> = {
	[variableGroupItem.type]: variableGroupItem,
};

export function getImplementation(type: string) {
	return realtimeImplementations[type];
}

export {
	variableGroupItem,
};
