import { TypedObject } from '@beak/common/helpers/typescript';

import { RealtimeValue } from './types';
import nonceRtv from './values/nonce';
import privateRtv from './values/private';
import secureRtv from './values/secure';
import timestampRtv from './values/timestamp';
import variableGroupItemRtv from './values/variable-group-item';

const realtimeImplementations: Record<string, RealtimeValue<any, any>> = {
	[nonceRtv.type]: nonceRtv,
	[privateRtv.type]: privateRtv,
	[secureRtv.type]: secureRtv,
	[timestampRtv.type]: timestampRtv,

	// Special case!
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
