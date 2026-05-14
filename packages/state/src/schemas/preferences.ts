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
		selected: z.enum(['project', 'variables']),
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
	})
	.strict();

export type ProjectPanePreferences = z.infer<typeof projectPanePreferencesSchema>;

/**
 * Request preference — `.beak/preferences/requests/<requestId>.json` on disk.
 */
export const requestPreferenceSchema = z
	.object({
		request: z
			.object({
				mainTab: z.enum(['headers', 'url_query', 'body', 'options']),
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

const tabSchema = z.discriminatedUnion('type', [
	requestTabSchema,
	variableSetEditorTabSchema,
	newProjectIntroTabSchema,
	preferencesTabSchema,
]);

export const tabPreferencesSchema = z
	.object({
		selectedTabPayload: z.string().min(1).optional(),
		tabs: z.array(tabSchema),
	})
	.strict();

export type TabPreferences = z.infer<typeof tabPreferencesSchema>;
