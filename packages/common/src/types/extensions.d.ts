import { VariableStaticInformation } from '@getbeak/extension-sdk';

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
