export interface RecentLocalProject {
	type: 'local';

	name: string;
	path: string;
	modifiedTime: string;
	exists: boolean;
}
