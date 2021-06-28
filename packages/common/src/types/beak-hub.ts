import { TabItem } from './beak-project';

export interface RecentLocalProject {
	type: 'local';

	name: string;
	path: string;
	accessTime: string;
	exists: boolean;
}

export type RequestPreferenceMainTab = 'headers' | 'url_query' | 'body' | 'options';

export interface RequestPreference {
	mainTab: RequestPreferenceMainTab;

	jsonEditor?: {
		expands: Record<string, boolean>;
	};
}

export interface UserPreferences {
	selectedTabPayload?: string;

	tabs: TabItem[];
}
