import { TypedObject } from '@beak/common/helpers/typescript';
import { VariableExtension } from '@beak/common/types/extensions';
import { ipcExtensionsService } from '@beak/ui/lib/ipc';
import { EditableVariable, Variable } from '@getbeak/types-variables';

import './ipc';
import base64DecodeRtv from './values/base64-decode';
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
import urlDecodeRtv from './values/url-decode';
import urlEncodeRtv from './values/url-encode';
import uuidRtv from './values/uuid';
import variableSetItemRtv from './values/variable-set-item';

type BasicOrEditableVariable = Variable<any> | EditableVariable<any>;

export class VariableManager {
	private static externalVariables: Record<string, BasicOrEditableVariable> = { };
	private static internalVariables: Record<string, BasicOrEditableVariable> = {
		[base64DecodeRtv.type]: base64DecodeRtv,
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
		[urlDecodeRtv.type]: urlDecodeRtv,
		[urlEncodeRtv.type]: urlEncodeRtv,
		[uuidRtv.type]: uuidRtv,

		// Special case!
		[variableSetItemRtv.type]: variableSetItemRtv,
	};

	static registerExternalVariable(ext: VariableExtension) {
		const rtv = ext.variable;

		this.externalVariables[rtv.type] = {
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
			getValue: async (ctx, payload, recursiveDepth) => ipcExtensionsService.rtvGetValue({
				type: rtv.type,
				context: ctx,
				payload,
				recursiveDepth,
			}),
		};

		if (!rtv.editable)
			return;

		(this.externalVariables[rtv.type] as EditableVariable<any, any>).editor = {
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

	static unregisterExternalVariable(type: string) {
		delete this.externalVariables[type];
	}

	static getVariable(type: string) {
		return this.internalVariables[type] ?? this.externalVariables[type];
	}

	static getVariables(currentRequestId?: string) {
		const allVariables = {
			...this.externalVariables,

			// Do this second to override any external attempts to override
			...this.internalVariables,
		};

		return TypedObject.values(allVariables)
			// Remove the variable set item as it's a special case tbh
			.filter(v => v.type !== variableSetItemRtv.type)
			.filter(v => {
				if (!v.attributes.requiresRequestId)
					return true;

				return currentRequestId;
			});
	}
}
