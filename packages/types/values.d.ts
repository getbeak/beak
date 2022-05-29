import { FlightHistory } from './flight';
import { Tree } from './nodes';
import { VariableGroups } from './variable-groups';

export type ValueParts = ValuePart[];
export type ValuePart = string | { type: string; payload: unknown };

export interface Context {
	selectedGroups: Record<string, string>;
	variableGroups: VariableGroups;
	projectTree: Tree;
	flightHistory: Record<string, FlightHistory>;
	currentRequestId?: string;
}
