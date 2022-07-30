import { EditorProps, loader } from '@monaco-editor/react';
import * as monaco from 'monaco-editor';

// Modified version of code from https://github.com/microsoft/monaco-editor/issues/2209
const httpLanguageDefinition = {
	ignoreCase: true,
	includeLF: true,
	defaultToken: 'source',
	brackets: [],

	tokenizer: {
		root: [
			[/^(?:[A-Z0-9]+\s)/, 'comment', '@overview'],
		],
		overview: [
			[/(.+\s)(.*)(\n)$/, ['variable.name', 'source', { token: 'source', next: '@headers' }]],
		],
		headers: [
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
