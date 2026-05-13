import type { EditorPreferences } from '@beak/common/types/preferences';
import type { ThemeMode } from '@beak/common/types/theme';
import useForceReRender from '@beak/ui/hooks/use-force-rerender';
import { ipcPreferencesService } from '@beak/ui/lib/ipc';
import { createDefaultOptions } from '@beak/ui/utils/monaco';
import Editor, { type EditorProps } from '@monaco-editor/react';
import { useTheme } from 'next-themes';
import React from 'react';
import { useEffect, useState } from 'react';

interface EditorViewProps extends EditorProps {}

/**
 * Monaco editor wrapper. Reads the active Chakra color mode through
 * next-themes so the editor switches between Monaco's `light` and `vs-dark`
 * built-in themes when the OS / user preference flips. The user's per-app
 * preference (`themeOverride`) still wins over the system preference, same
 * behaviour as the styled-components version.
 */
const EditorView: React.FC<EditorViewProps> = props => {
	const { resolvedTheme } = useTheme();
	const [preferences, setPreferences] = useState<EditorPreferences>();
	const [latestRender, forceRerender] = useForceReRender();

	useEffect(() => void ipcPreferencesService.getEditorOverview().then(setPreferences), [latestRender]);
	useEffect(() => {
		function listener() {
			forceRerender();
		}

		window.secureBridge.ipc.on('editor_preferences_updated', listener);

		return () => {
			window.secureBridge.ipc.off('editor_preferences_updated', listener);
		};
	}, []);

	if (!preferences) return null;

	return (
		<Editor
			theme={getRenderedTheme(resolvedTheme === 'dark' ? 'dark' : 'light', preferences.themeOverride)}
			{...props}
			options={{
				...createDefaultOptions(preferences),
				...props.options,
			}}
		/>
	);
};

function getRenderedTheme(theme: 'light' | 'dark', preferenceThemeMode: ThemeMode) {
	if (preferenceThemeMode === 'system') return theme === 'dark' ? 'vs-dark' : 'light';

	return preferenceThemeMode === 'dark' ? 'vs-dark' : 'light';
}

export default EditorView;
