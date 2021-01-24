import { RealtimeValue, VariableGroups } from '@beak/common/types/beak-project';

interface HtmlBlob {
	type: string;
	dataset?: Record<string, string | number | boolean>;
	key?: string;
	renderer: {
		title: string;
		body?: string;
	};
}

export interface RealtimeValueImplementation<T extends RealtimeValue> {
	type: string;

	toHtml: (item: T, variableGroups: VariableGroups) => HtmlBlob;
	fromHtml: (dataset: DOMStringMap) => T;
	parse: (item: T, variableGroups: VariableGroups, selectedGroups: Record<string, string>) => string;
}
