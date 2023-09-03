import React, { useEffect, useState } from 'react';
import useForceReRender from '@beak/ui/hooks/use-force-rerender';
import { ipcPreferencesService } from '@beak/ui/lib/ipc';
import { createDefaultOptions } from '@beak/ui/utils/monaco';
import { EditorPreferences } from '@beak/common/types/preferences';
import { Theme, ThemeMode } from '@beak/common/types/theme';
import Editor, { EditorProps } from '@monaco-editor/react';
import { useTheme } from 'styled-components';

interface EditorViewProps extends EditorProps { }

const EditorView: React.FC<EditorViewProps> = props => {
	const { theme } = useTheme();
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

	if (!preferences)
		return null;

	return (
		<Editor
			theme={getRenderedTheme(theme, preferences.themeOverride)}
			{...props}
			options={{
				...createDefaultOptions(preferences),
				...props.options,
			}}
		/>
	);
};

function getRenderedTheme(theme: Theme, preferenceThemeMode: ThemeMode) {
	if (preferenceThemeMode === 'system')
		return theme === 'dark' ? 'vs-dark' : 'light';

	return preferenceThemeMode === 'dark' ? 'vs-dark' : 'light';
}

export default EditorView;
