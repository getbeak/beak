import { EditorProps, loader } from '@monaco-editor/react';
import * as monaco from 'monaco-editor';
import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';
import cssWorker from 'monaco-editor/esm/vs/language/css/css.worker?worker';
import htmlWorker from 'monaco-editor/esm/vs/language/html/html.worker?worker';
import jsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker';
import tsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker';

// @ts-expect-error
self.MonacoEnvironment = {
	getWorker(_: unknown, label: string) {
		if (label === 'json')
			return new jsonWorker();

		if (label === 'css' || label === 'scss' || label === 'less')
			return new cssWorker();

		if (label === 'html' || label === 'handlebars' || label === 'razor')
			return new htmlWorker();

		if (label === 'typescript' || label === 'javascript')
			return new tsWorker();

		return new editorWorker();
	},
};

// Modified version of code from https://github.com/microsoft/monaco-editor/issues/2209
const httpLanguageDefinition: monaco.languages.IMonarchLanguage = {
	ignoreCase: true,
	includeLF: true,
	defaultToken: 'source',
	brackets: [],

	tokenizer: {
		root: [
			[/^(?:[A-Z0-9]+\s)/, 'comment', '@overview'],
		],
		overview: [
			// @ts-expect-error
			[/(.+\s)(.*)(\n)$/, ['variable.name', 'source', { token: 'source', next: '@headers' }]],
		],
		headers: [
			// @ts-expect-error
			[/^(content-type\s*)(:)/, ['variable.name', { token: 'delimiter', next: '@content_type' }]],
			[/^([^:]+)(:)(.+\n)$/, ['variable.name', 'delimiter', 'source']],

			// We're going to the body now
			[
				/^\n?$/,
				{
					token: 'source',
					next: '@body',
					nextEmbedded: '$S2',
					log: '$S2',
				},
			],
		],

		content_type: [
			// Pull out mime-type so we can style the body accordingly
			// @ts-expect-error
			[/(\s*)([a-z0-9.-]+\/[a-z0-9.+-]+)(.*\n)$/, ['source', { token: 'source', next: '@headers.$2' }, 'source']],

			[/./, '@rematch', '@pop'],
		],

		body: [
			[/^.+$/, ''],

			// idk why this is needed, but it doesn't work without it
			[/^eof$/, { token: '@rematch', next: '@pop', nextEmbedded: '@pop' }],
		],
	},
};

export function createDefaultOptions(): EditorProps['options'] {
	return {
		automaticLayout: true,
		minimap: { enabled: false },
		fontFamily: '"Fira Code", Source Code Pro, Menlo, Monaco, Consolas, "Courier New", monospace',
		fontSize: 11,
		// wordWrap: true,
		scrollbar: {
			verticalScrollbarSize: 10,
			horizontalScrollbarSize: 10,
		},
	};
}

export function setupMonaco() {
	loader.config({ monaco });

	loader.init().then(monaco => {
		monaco.languages.register({ id: 'http' });
		monaco.languages.setMonarchTokensProvider('http', httpLanguageDefinition);
	});
}
