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

export type SidebarVariant = 'project' | 'variables';

export interface SidebarPreferences {
	selected: SidebarVariant;
	collapsed: Record<string, boolean>;
}

export interface ProjectPanePreferences {
	collapsed: Record<string, boolean>;
}

export interface TabPreferences {
	selectedTabPayload?: string;

	tabs: TabItem[];
}
