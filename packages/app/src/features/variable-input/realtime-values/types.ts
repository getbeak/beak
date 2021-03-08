import { RealtimeValuePart, VariableGroups } from '@beak/common/types/beak-project';

export interface RealtimeValue<T extends Record<string, unknown> | void = void> {
	type: string;

	name: string;
	description: string;

	initValuePart: (variableGroups: VariableGroups) => Promise<RealtimeValuePart>;
	createValuePart: (item: T, variableGroups: VariableGroups) => RealtimeValuePart;

	getValue: (item: T, variableGroups: VariableGroups, selectedGroups: Record<string, string>) => string;
}
