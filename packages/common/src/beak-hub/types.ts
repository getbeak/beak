export interface RecentLocalProject {
	type: 'local';

	name: string;
	path: string;
	modifiedTime: string;
	exists: boolean;
}

export interface RequestPreference {
	mainTab: string;
	subTab: string | null;
}
