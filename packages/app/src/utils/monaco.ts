import { editor } from 'monaco-editor/esm/vs/editor/editor.api';

export function createDefaultOptions(): editor.IStandaloneEditorConstructionOptions {
	return {
		automaticLayout: true,
		minimap: { enabled: false },
		fontFamily: '"Fira Code", Source Code Pro, Menlo, Monaco, "Courier New", monospace',
		fontSize: 10,
		scrollbar: {
			verticalScrollbarSize: 10,
			horizontalScrollbarSize: 10,
		},
	};
}
