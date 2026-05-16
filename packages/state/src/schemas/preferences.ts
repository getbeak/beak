import { z } from 'zod';

/**
 * Editor preferences — `.beak/preferences/editor.json` on disk.
 */
export const editorPreferencesSchema = z
	.object({
		selectedVariableSets: z.record(z.string(), z.string().min(1)).default({}),
	})
	.strict();

export type EditorPreferences = z.infer<typeof editorPreferencesSchema>;

/**
 * Sidebar preferences — `.beak/preferences/sidebar.json` on disk.
 */
export const sidebarPreferencesSchema = z
	.object({
		// On-disk prefs from before the rename used `endpoints` — they fail
		// validation now and the loader falls back to the default pane.
		// Acceptable: this branch isn't in production yet.
		selected: z.enum(['project', 'variables', 'schemas', 'extensions', 'workflows']),
		collapsed: z.record(z.string(), z.boolean()),
	})
	.strict();

export type SidebarPreferences = z.infer<typeof sidebarPreferencesSchema>;

/**
 * Project pane preferences — `.beak/preferences/project-pane.json` on disk.
 */
export const projectPanePreferencesSchema = z
	.object({
		collapsed: z.record(z.string(), z.boolean()),
		/**
		 * When true, the project tree reveals folders under a `_`-prefixed
		 * segment (schema sources, etc.). Off by default — these are managed
		 * metadata subtrees the user usually shouldn't hand-edit.
		 */
		showHiddenFolders: z.boolean().optional(),
		/**
		 * Filter applied to the project tree. `requests` hides workflows;
		 * `workflows` hides requests; `all` (or absent) shows everything.
		 */
		explorerFilter: z.enum(['all', 'requests', 'workflows']).optional(),
	})
	.strict();

export type ProjectPanePreferences = z.infer<typeof projectPanePreferencesSchema>;

/**
 * Pane preferences — `.beak/preferences/panes.json` on disk.
 *
 * `pixelSizes` holds absolute widths/heights for panes that should stay a
 * fixed pixel size when the window resizes (e.g. the main sidebar). Values
 * are clamped on read by the consumer.
 *
 * `splitRatios` holds the fraction (0..1) occupied by the *first* pane of
 * a two-pane split. The second pane gets `1 - ratio`. Used for the request/
 * response and modifiers/raw splits which should remain proportional.
 */
export const panePreferencesSchema = z
	.object({
		pixelSizes: z.record(z.string(), z.number().finite().nonnegative()).default({}),
		splitRatios: z.record(z.string(), z.number().min(0).max(1)).default({}),
	})
	.strict();

export type PanePreferences = z.infer<typeof panePreferencesSchema>;

/**
 * Request preference — `.beak/preferences/requests/<requestId>.json` on disk.
 */
export const requestPreferenceSchema = z
	.object({
		request: z
			.object({
				mainTab: z.enum(['headers', 'url_query', 'body', 'options']),
				/**
				 * Editor mode for the active sub-tab. `values` (default) is the
				 * familiar fill-in-the-blanks view; `schema` shows + edits the
				 * structural contract (names, types, required, description).
				 */
				editorMode: z.enum(['schema', 'values']).optional(),
				jsonEditor: z
					.object({
						expanded: z.record(z.string(), z.boolean()),
					})
					.strict()
					.optional(),
			})
			.strict(),
		response: z
			.object({
				mainTab: z.enum(['overview', 'request', 'response']),
				subTab: z.record(z.string(), z.string().min(1)),
				pretty: z.record(
					z.string(),
					z
						.object({
							language: z.string().min(1).nullable(),
						})
						.strict(),
				),
			})
			.strict(),
	})
	.strict();

export type RequestPreference = z.infer<typeof requestPreferenceSchema>;

/**
 * Tab preferences — currently used by the tabs feature for persisted state.
 */
const requestTabSchema = z
	.object({
		type: z.literal('request'),
		payload: z.string().min(1),
		temporary: z.boolean(),
	})
	.strict();

const variableSetEditorTabSchema = z
	.object({
		type: z.literal('variable_set_editor'),
		payload: z.string().min(1),
		temporary: z.boolean(),
	})
	.strict();

const newProjectIntroTabSchema = z
	.object({
		type: z.literal('new_project_intro'),
		payload: z.literal('new_project_intro'),
		temporary: z.boolean(),
	})
	.strict();

const preferencesTabSchema = z
	.object({
		type: z.literal('preferences'),
		payload: z.literal('preferences'),
		temporary: z.boolean(),
	})
	.strict();

const projectHomeTabSchema = z
	.object({
		type: z.literal('project_home'),
		payload: z.literal('project_home'),
		temporary: z.boolean(),
	})
	.strict();

const folderOverviewTabSchema = z
	.object({
		type: z.literal('folder_overview'),
		payload: z.string().min(1),
		temporary: z.boolean(),
	})
	.strict();

const cookieJarTabSchema = z
	.object({
		type: z.literal('cookie_jar'),
		payload: z.literal('cookie_jar'),
		temporary: z.boolean(),
	})
	.strict();

const workflowEditorTabSchema = z
	.object({
		type: z.literal('workflow_editor'),
		payload: z.string().min(1),
		temporary: z.boolean(),
	})
	.strict();

const variableInputPlaygroundTabSchema = z
	.object({
		type: z.literal('variable_input_playground'),
		payload: z.literal('variable_input_playground'),
		temporary: z.boolean(),
	})
	.strict();

const tabSchema = z.discriminatedUnion('type', [
	requestTabSchema,
	variableSetEditorTabSchema,
	newProjectIntroTabSchema,
	preferencesTabSchema,
	projectHomeTabSchema,
	folderOverviewTabSchema,
	cookieJarTabSchema,
	workflowEditorTabSchema,
	variableInputPlaygroundTabSchema,
]);

export const tabPreferencesSchema = z
	.object({
		selectedTabPayload: z.string().min(1).optional(),
		tabs: z.array(tabSchema),
	})
	.strict();

export type TabPreferences = z.infer<typeof tabPreferencesSchema>;
