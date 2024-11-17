import { FlightHistory } from './flight';
import { Tree } from './nodes';
import { VariableSets } from './variable-sets';

export type ValueSections = ValueSection[];
export type ValueSection = string | { type: string; payload: unknown };

export interface Context {
	selectedSets: Record<string, string>;
	variableSets: VariableSets;
	projectTree: Tree;
	flightHistory: Record<string, FlightHistory>;
	currentRequestId?: string;
}
