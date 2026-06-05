import type { EditorPreferences } from '@beak/common/types/preferences';
import type { ThemeMode } from '@beak/common/types/theme';
import useForceReRender from '@beak/ui/hooks/use-force-rerender';
import { ipcPreferencesService } from '@beak/ui/lib/ipc';
import { createDefaultOptions } from '@beak/ui/utils/monaco';
import type { Monaco } from '@monaco-editor/react';
import Editor, { type EditorProps } from '@monaco-editor/react';
import React, { useCallback, useEffect, useMemo, useState } from 'react';

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

interface EditorViewProps extends EditorProps {
	/**
	 * Optional JSON Schema to register with Monaco's JSON language service so
	 * the editor highlights validation errors as the user types. The schema
	 * is bound to the editor's model URI via a unique `fileMatch` derived
	 * from `schemaId` so different editor instances don't clobber each
	 * other's diagnostics options. Only applies when `language === 'json'`.
	 */
	jsonSchema?: object;
	/**
	 * Stable identifier used to bind the model + schema together. Provide
	 * a per-request id (e.g. the request ksuid) so each open editor gets
	 * its own URI and Monaco can match the right schema to the right model.
	 */
	schemaId?: string;
}

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
	const { jsonSchema, schemaId, ...editorProps } = props;

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

	// File pattern that pairs a model URI with the registered schema. Stable
	// across re-renders so Monaco's JSON language service keeps applying the
	// same schema as the user types. Without a schemaId we fall back to a
	// generic name — multiple schema-aware editors would clobber each other
	// but a single editor still works.
	const fileName = useMemo(() => {
		const id = schemaId ? schemaId.replace(/[^a-zA-Z0-9_-]/g, '_') : 'document';
		return `beak-${id}.json`;
	}, [schemaId]);
	const fileUri = `inmemory://beak/${fileName}`;

	const handleBeforeMount = useCallback(
		(monaco: Monaco) => {
			if (props.language !== 'json' || !jsonSchema) return;
			// Register the schema with the JSON language service. We merge
			// rather than replace so other editors keep their bindings.
			// `@monaco-editor/react`'s `Monaco` type elides the language
			// service surface; we cast through unknown to reach the JSON
			// defaults that the underlying `monaco-editor` package exposes.
			interface JsonDefaults {
				diagnosticsOptions: {
					validate?: boolean;
					schemas?: { uri: string; fileMatch?: string[]; schema?: unknown }[];
				};
				setDiagnosticsOptions: (options: {
					validate?: boolean;
					schemas?: { uri: string; fileMatch?: string[]; schema?: unknown }[];
				}) => void;
			}
			const jsonDefaults = (monaco.languages as unknown as { json?: { jsonDefaults?: JsonDefaults } }).json?.jsonDefaults;
			if (!jsonDefaults) return;
			const existing = jsonDefaults.diagnosticsOptions.schemas ?? [];
			const without = existing.filter(s => s.uri !== fileUri);
			jsonDefaults.setDiagnosticsOptions({
				...jsonDefaults.diagnosticsOptions,
				validate: true,
				schemas: [...without, { uri: fileUri, fileMatch: [fileName], schema: jsonSchema }],
			});
		},
		[fileName, fileUri, jsonSchema, props.language],
	);

	if (!preferences) return null;

	return (
		<Editor
			theme={getRenderedTheme(resolvedTheme === 'dark' ? 'dark' : 'light', preferences.themeOverride)}
			path={props.language === 'json' && jsonSchema ? fileName : undefined}
			beforeMount={handleBeforeMount}
			{...editorProps}
			options={{
				...createDefaultOptions(preferences),
				...editorProps.options,
			}}
		/>
	);
};

function getRenderedTheme(theme: 'light' | 'dark', preferenceThemeMode: ThemeMode) {
	if (preferenceThemeMode === 'system') return theme === 'dark' ? 'beak-dark' : 'beak-light';

	return preferenceThemeMode === 'dark' ? 'beak-dark' : 'beak-light';
}

export default EditorView;
