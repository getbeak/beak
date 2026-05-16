import type { EditorPreferences } from '@beak/common/types/preferences';
import type { ThemeMode } from '@beak/common/types/theme';
import useForceReRender from '@beak/ui/hooks/use-force-rerender';
import { ipcPreferencesService } from '@beak/ui/lib/ipc';
import { createDefaultOptions } from '@beak/ui/utils/monaco';
import Editor, { type EditorProps } from '@monaco-editor/react';
import React from 'react';
import { useEffect, useState } from 'react';

/**
 * Returns 'dark' when the document's root carries the `dark` class, 'light'
 * otherwise. We read the class attribute directly (and observe mutations)
 * instead of using `next-themes`' `useTheme()` because the latter sometimes
 * returns `resolvedTheme: undefined` on the first render, which used to make
 * Monaco mount with the light theme even when the app was set to dark.
 */
function useDocumentColorScheme(): 'light' | 'dark' {
	const [scheme, setScheme] = useState<'light' | 'dark'>(() =>
		typeof document !== 'undefined' && document.documentElement.classList.contains('dark') ? 'dark' : 'light',
	);

	useEffect(() => {
		const root = document.documentElement;
		const sync = () => setScheme(root.classList.contains('dark') ? 'dark' : 'light');
		sync();
		const observer = new MutationObserver(sync);
		observer.observe(root, { attributes: true, attributeFilter: ['class'] });
		return () => observer.disconnect();
	}, []);

	return scheme;
}

interface EditorViewProps extends EditorProps {}

/**
 * Monaco editor wrapper. Reads the active Chakra color mode through
 * next-themes so the editor switches between Monaco's `light` and `vs-dark`
 * built-in themes when the OS / user preference flips. The user's per-app
 * preference (`themeOverride`) still wins over the system preference, same
 * behaviour as before.
 */
const EditorView: React.FC<EditorViewProps> = props => {
	const resolvedTheme = useDocumentColorScheme();
	const [preferences, setPreferences] = useState<EditorPreferences>();
	const [latestRender, forceRerender] = useForceReRender();

	useEffect(() => {
		let cancelled = false;
		ipcPreferencesService.getEditorOverview().then(prefs => {
			if (!cancelled) setPreferences(prefs);
		});
		return () => {
			cancelled = true;
		};
	}, [latestRender]);
	useEffect(() => {
		function listener() {
			forceRerender();
		}

		window.secureBridge.ipc.on('editor_preferences_updated', listener);

		return () => {
			window.secureBridge.ipc.off('editor_preferences_updated', listener);
		};
	}, [forceRerender]);

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
	if (preferenceThemeMode === 'system') return theme === 'dark' ? 'beak-dark' : 'beak-light';

	return preferenceThemeMode === 'dark' ? 'beak-dark' : 'beak-light';
}

export default EditorView;
