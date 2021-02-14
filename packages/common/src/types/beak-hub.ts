export interface RecentLocalProject {
	type: 'local';

	name: string;
	path: string;
	modifiedTime: string;
	exists: boolean;
}

export type RequestPreferenceMainTab = 'headers' | 'url_query' | 'body' | 'options';

export interface RequestPreference {
	mainTab: RequestPreferenceMainTab;

	jsonEditor?: {
		expands: Record<string, boolean>;
	};
}
