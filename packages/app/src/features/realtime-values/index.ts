import { TypedObject } from '@beak/common/helpers/typescript';

import { RealtimeValue } from './types';
import base64EncodeRtv from './values/base64-encode';
import digestRtv from './values/digest';
import nonceRtv from './values/nonce';
import privateRtv from './values/private';
import requestFolderRtv from './values/request-folder';
import requestHeaderRtv from './values/request-header';
import requestMethodRtv from './values/request-method';
import requestNameRtv from './values/request-name';
import responseStatusCodeRtv from './values/response-status-code';
import secureRtv from './values/secure';
import { characterCarriageReturnRtv, characterNewlineRtv, characterTabRtv } from './values/special-character';
import timestampRtv from './values/timestamp';
import uuidRtv from './values/uuid';
import variableGroupItemRtv from './values/variable-group-item';

const realtimeImplementations: Record<string, RealtimeValue<any, any>> = {
	[base64EncodeRtv.type]: base64EncodeRtv,
	[characterCarriageReturnRtv.type]: characterCarriageReturnRtv,
	[characterNewlineRtv.type]: characterNewlineRtv,
	[characterTabRtv.type]: characterTabRtv,
	[digestRtv.type]: digestRtv,
	[nonceRtv.type]: nonceRtv,
	[privateRtv.type]: privateRtv,
	[requestFolderRtv.type]: requestFolderRtv,
	[requestHeaderRtv.type]: requestHeaderRtv,
	[requestMethodRtv.type]: requestMethodRtv,
	[requestNameRtv.type]: requestNameRtv,
	[responseStatusCodeRtv.type]: responseStatusCodeRtv,
	[secureRtv.type]: secureRtv,
	[timestampRtv.type]: timestampRtv,
	[uuidRtv.type]: uuidRtv,

	// Special case!
	[variableGroupItemRtv.type]: variableGroupItemRtv,
};

export function getRealtimeValue(type: string) {
	return realtimeImplementations[type];
}

export function getRealtimeValues(currentRequestId?: string) {
	return TypedObject.values(realtimeImplementations)
		// Remove the variable group item as it's a special case tbh
		.filter(v => v.type !== variableGroupItemRtv.type)
		.filter(v => {
			if (!v.attributes.requiresRequestId)
				return true;

			return currentRequestId;
		});
}
