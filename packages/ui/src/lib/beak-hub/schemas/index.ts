// Schemas live in @beak/state/schemas now (zod-based, with z.infer types).
// This module re-exports them under the legacy names for back-compat.
export {
	editorPreferencesSchema as editorPreferences,
	panePreferencesSchema as panePreferences,
	projectPanePreferencesSchema as projectPanePreferences,
	requestPreferenceSchema as requestPreference,
	sidebarPreferencesSchema as sidebarPreferences,
	tabPreferencesSchema as tabPreferences,
} from '@beak/state/schemas';
