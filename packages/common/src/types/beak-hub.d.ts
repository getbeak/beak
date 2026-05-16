import { TabItem } from './beak-project';

export interface RecentProject {
	name: string;
	path: string;
	accessTime: string;
}

export type RequestPreferenceMainTab = 'headers' | 'url_query' | 'body' | 'options';
export type ResponsePreferenceMainTab = 'overview' | 'request' | 'response';
export type RequestEditorMode = 'schema' | 'values';

export interface RequestPreference {
	request: {
		mainTab: RequestPreferenceMainTab;
		/** Current editor mode — defaults to 'values' when unset. */
		editorMode?: RequestEditorMode;

		jsonEditor?: {
			expanded: Record<string, boolean>;
		};
	};
	response: {
		mainTab: ResponsePreferenceMainTab;
		subTab: Partial<Record<ResponsePreferenceMainTab, undefined | string>>;
		pretty: {
			request: {
				language: string | null;
			};
			response: {
				language: string | null;
			};
		};
	};
}

export interface EditorPreferences {
	selectedVariableSets: Record<string, string>;
}

export type SidebarVariant = 'project' | 'variables' | 'endpoints' | 'extensions';

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
