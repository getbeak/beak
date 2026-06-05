import { TypedObject } from '@beak/common/helpers/typescript';
import type { ExtensionVariable, LoadedExtension } from '@beak/common/types/extensions';
import { ipcExtensionsService } from '@beak/ui/lib/ipc';
import type { EditableVariable, Variable } from '@getbeak/extension-sdk';

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
	private static externalVariables: Record<string, BasicOrEditableVariable> = {};
	private static externalVariablesByPackage: Record<string, string[]> = {};
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

	/**
	 * Register every variable contributed by an extension package. Replaces
	 * any previously-registered variables for the same package.
	 */
	static registerExtension(extension: LoadedExtension) {
		VariableManager.unregisterExtension(extension.packageName);

		const registered: string[] = [];
		for (const variable of extension.variables) {
			VariableManager.externalVariables[variable.type] = buildAdapter(variable);
			registered.push(variable.type);
		}

		VariableManager.externalVariablesByPackage[extension.packageName] = registered;
	}

	static unregisterExtension(packageName: string) {
		const types = VariableManager.externalVariablesByPackage[packageName];
		if (!types) return;

		for (const type of types) delete VariableManager.externalVariables[type];
		delete VariableManager.externalVariablesByPackage[packageName];
	}

	static getVariable(type: string) {
		return VariableManager.internalVariables[type] ?? VariableManager.externalVariables[type];
	}

	static getVariables(currentRequestId?: string) {
		const allVariables = {
			...VariableManager.externalVariables,

			// Internal second to win any external overrides.
			...VariableManager.internalVariables,
		};

		return TypedObject.values(allVariables)
			.filter(v => v.type !== variableSetItemRtv.type)
			.filter(v => {
				if (!v.attributes.requiresRequestId) return true;
				return currentRequestId;
			});
	}
}

/* -------------------------------------------------------------------------- */
/*  Adapter: wrap an extension's variable metadata in IPC-backed callbacks.   */
/* -------------------------------------------------------------------------- */

function buildAdapter(variable: ExtensionVariable): BasicOrEditableVariable {
	const base: Variable<any> = {
		type: variable.type,
		name: variable.name,
		description: variable.description,
		sensitive: variable.sensitive,
		external: true,
		attributes: variable.attributes,
		createDefaultPayload: async ctx =>
			ipcExtensionsService.variableCreateDefaultPayload({
				type: variable.type,
				context: ctx,
			}),
		getValue: async (ctx, payload, recursiveDepth) =>
			ipcExtensionsService.variableGetValue({
				type: variable.type,
				context: ctx,
				payload,
				recursiveDepth,
			}),
	};

	if (variable.binary) {
		base.getAssetRef = async (ctx, payload, recursiveDepth) => {
			const ref = await ipcExtensionsService.variableGetAssetRef({
				type: variable.type,
				context: ctx,
				payload,
				recursiveDepth,
			});
			return ref;
		};
	}

	if (!variable.editable) return base;

	const editable = base as EditableVariable<any, any>;
	editable.editor = {
		createUserInterface: ctx =>
			ipcExtensionsService.variableEditorCreateUI({ type: variable.type, context: ctx }) as Promise<any>,
		load: (ctx, payload) =>
			ipcExtensionsService.variableEditorLoad({ type: variable.type, context: ctx, payload }) as Promise<any>,
		save: (ctx, existingPayload, state) =>
			ipcExtensionsService.variableEditorSave({
				type: variable.type,
				context: ctx,
				existingPayload,
				state,
			}) as Promise<any>,
	};

	return editable;
}
