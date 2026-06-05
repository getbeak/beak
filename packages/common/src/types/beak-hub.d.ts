import { TabItem } from './beak-project';

/**
 * Distinguishes where a recent project's bytes actually live, so the welcome
 * screen can render the right affordance instead of a meaningless `path` for
 * sandboxed storage.
 *
 *   - `desktop`       — Electron, real filesystem path.
 *   - `browser`       — Web shell, OPFS-namespaced (sandboxed, no OS path).
 *   - `local-folder`  — Web shell, mounted via the File System Access API.
 *                       The handle is persisted in IDB; `path` is the in-fs
 *                       path (typically `/`) and `name` is the picked folder's
 *                       basename — the OS-level path isn't exposed by FSA.
 *
 * Optional for back-compat with stores that pre-date this field. Consumers
 * should default to the host's natural source (electron → `desktop`,
 * web → `browser`).
 */
export type RecentProjectSource = 'desktop' | 'browser' | 'local-folder';

export interface RecentProject {
	name: string;
	path: string;
	accessTime: string;
	source?: RecentProjectSource;
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

export type SidebarVariant = 'project' | 'variables' | 'schemas' | 'extensions';

export interface SidebarPreferences {
	selected: SidebarVariant;
	collapsed: Record<string, boolean>;
}

export interface ProjectPanePreferences {
	collapsed: Record<string, boolean>;
	showHiddenFolders?: boolean;
	/**
	 * Filter applied to the project tree. `requests` hides workflows;
	 * `workflows` hides requests; `all` (default) shows everything. Folders
	 * without matching descendants are also hidden when a filter is active.
	 */
	explorerFilter?: 'all' | 'requests' | 'workflows';
}

export interface PanePreferences {
	pixelSizes: Record<string, number>;
	splitRatios: Record<string, number>;
}

export interface TabPreferences {
	selectedTabPayload?: string;

	tabs: TabItem[];
}
