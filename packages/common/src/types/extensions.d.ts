import { VariableStaticInformation } from '@getbeak/types-variables';

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
