import { TypedObject } from '@beak/common/helpers/typescript';

import nonceRtv from './nonce';
import secureRtv from './secure';
import timestampRtv from './timestamp';
import { RealtimeValue } from './types';
import variableGroupItemRtv from './variable-group-item';

const realtimeImplementations: Record<string, RealtimeValue<any, any>> = {
	[nonceRtv.type]: nonceRtv,
	[secureRtv.type]: secureRtv,
	[timestampRtv.type]: timestampRtv,
	[variableGroupItemRtv.type]: variableGroupItemRtv,
};

export function getRealtimeValue(type: string) {
	return realtimeImplementations[type];
}

export function getRealtimeValues() {
	return TypedObject.values(realtimeImplementations)
		// Remove the variable group item as it's a special case tbh
		.filter(v => v.type !== variableGroupItemRtv.type);
}
