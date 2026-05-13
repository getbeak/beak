// biome-ignore lint/style/noRestrictedImports: type-only import of the extension-sdk's variable contract used by the cross-process VariableExtension shape.
import type { VariableStaticInformation } from '@getbeak/extension-sdk';

export interface VariableExtension {
	name: string;
	version: string;
	filePath: string;
	valid: true;
	variable: {
		type: string;
		editable: boolean;
	} & VariableStaticInformation;
}
