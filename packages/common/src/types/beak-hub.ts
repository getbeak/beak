import { TabItem } from './beak-project';

export interface RecentLocalProject {
	type: 'local';

	name: string;
	path: string;
	accessTime: string;
}

export type RequestPreferenceMainTab = 'headers' | 'url_query' | 'body' | 'options';

export interface RequestPreference {
	mainTab: RequestPreferenceMainTab;

	jsonEditor?: {
		expanded: Record<string, boolean>;
	};
}

export interface EditorPreferences {
	selectedVariableGroups: Record<string, string>;
}

export interface TabPreferences {
	selectedTabPayload?: string;

	tabs: TabItem[];
}
