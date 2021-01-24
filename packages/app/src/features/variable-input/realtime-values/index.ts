import { TypedObject } from '@beak/common/helpers/typescript';

import nonce from './nonce';
import { RealtimeValueImplementation } from './types';
import variableGroupItem from './variable-group-item';

const realtimeImplementations: Record<string, RealtimeValueImplementation<any>> = {
	[nonce.type]: nonce,
	[variableGroupItem.type]: variableGroupItem,
};

export function getImplementation(type: string) {
	return realtimeImplementations[type];
}

export function listValues() {
	return TypedObject.values(realtimeImplementations)
		.filter(v => v.type !== variableGroupItem.type)
		.map(v => v.fromHtml({})); // TODO(afr): Handle this in a proper way
}

export {
	variableGroupItem,
};
