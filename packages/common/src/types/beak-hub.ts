export interface RecentLocalProject {
	type: 'local';

	name: string;
	path: string;
	modifiedTime: string;
	exists: boolean;
}

export type RequestPreferenceMainTab = 'headers' | 'url_query' | 'body' | 'options';
export type RequestPreferenceBodySubTab = 'text' | 'json' | 'url_encoded_form' | 'multipart_encoded_form';

export interface RequestPreference {
	mainTab: RequestPreferenceMainTab;

	bodySubTab: RequestPreferenceBodySubTab;

	jsonEditor?: {
		expands: Record<string, boolean>;
	};
}
