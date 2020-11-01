export interface RecentLocalProject {
	type: 'local';

	name: string;
	path: string;
	modifiedTime: string;
	exists: boolean;
}

export type RequestPreferenceMainTab = 'debugging' | 'headers' | 'url_query' | 'body' | 'options';

export interface RequestPreference {
	mainTab: RequestPreferenceMainTab;
	subTab: string | null;
}
