import { ipcExtensionsService } from '@beak/app/lib/ipc';
import { TypedObject } from '@beak/common/helpers/typescript';
import { RealtimeValueExtension } from '@beak/common/types/extensions';
import { EditableRealtimeValue, RealtimeValue } from '@getbeak/types-realtime-value';

import './ipc';
import base64EncodeRtv from './values/base64-encode';
import digestRtv from './values/digest';
import nonceRtv from './values/nonce';
import privateRtv from './values/private';
import requestFolderRtv from './values/request-folder';
import requestHeaderRtv from './values/request-header';
import requestMethodRtv from './values/request-method';
import requestNameRtv from './values/request-name';
import responseBodyJsonRtv from './values/response-body-json';
import responseBodyTextRtv from './values/response-body-text';
import responseHeaderRtv from './values/response-header';
import responseStatusCodeRtv from './values/response-status-code';
import secureRtv from './values/secure';
import { characterCarriageReturnRtv, characterNewlineRtv, characterTabRtv } from './values/special-character';
import timestampRtv from './values/timestamp';
import uuidRtv from './values/uuid';
import variableGroupItemRtv from './values/variable-group-item';

type Rtv = RealtimeValue<any> | EditableRealtimeValue<any>;

export class RealtimeValueManager {
	private static externalRealtimeValues: Record<string, Rtv> = { };
	private static internalRealtimeValues: Record<string, Rtv> = {
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
		[responseBodyJsonRtv.type]: responseBodyJsonRtv,
		[responseBodyTextRtv.type]: responseBodyTextRtv,
		[responseHeaderRtv.type]: responseHeaderRtv,
		[responseStatusCodeRtv.type]: responseStatusCodeRtv,
		[secureRtv.type]: secureRtv,
		[timestampRtv.type]: timestampRtv,
		[uuidRtv.type]: uuidRtv,

		// Special case!
		[variableGroupItemRtv.type]: variableGroupItemRtv,
	};

	static registerExternalRealtimeValue(ext: RealtimeValueExtension) {
		const rtv = ext.realtimeValue;

		this.externalRealtimeValues[rtv.type] = {
			type: rtv.type,
			name: rtv.name,
			description: rtv.description,
			sensitive: rtv.sensitive,
			external: true,
			attributes: rtv.attributes,
			createDefaultPayload: async ctx => ipcExtensionsService.rtvCreateDefaultPayload({
				type: rtv.type,
				context: ctx,
			}),
			getValue: async (ctx, payload, recursiveSet) => ipcExtensionsService.rtvGetValue({
				type: rtv.type,
				context: ctx,
				payload,
				recursiveSet: Array.from(recursiveSet),
			}),
		};

		if (!rtv.editable)
			return;

		(this.externalRealtimeValues[rtv.type] as EditableRealtimeValue<any, any>).editor = {
			createUserInterface: ctx => ipcExtensionsService.rtvEditorCreateUserInterface({
				type: rtv.type,
				context: ctx,
			}),
			load: (ctx, payload) => ipcExtensionsService.rtvEditorLoad({
				type: rtv.type,
				context: ctx,
				payload,
			}),
			save: (ctx, existingPayload, state) => ipcExtensionsService.rtvEditorSave({
				type: rtv.type,
				context: ctx,
				existingPayload,
				state,
			}),
		};
	}

	static unregisterExternalRealtimeValues(type: string) {
		delete this.externalRealtimeValues[type];
	}

	static getRealtimeValue(type: string) {
		return this.internalRealtimeValues[type] ?? this.externalRealtimeValues[type];
	}

	static getRealtimeValues(currentRequestId?: string) {
		const allRealtimeValues = {
			...this.externalRealtimeValues,

			// Do this second to override any external attempts to override
			...this.internalRealtimeValues,
		};

		return TypedObject.values(allRealtimeValues)
			// Remove the variable group item as it's a special case tbh
			.filter(v => v.type !== variableGroupItemRtv.type)
			.filter(v => {
				if (!v.attributes.requiresRequestId)
					return true;

				return currentRequestId;
			});
	}
}
