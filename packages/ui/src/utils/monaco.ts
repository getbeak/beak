import type { EditorPreferences } from '@beak/common/types/preferences';
import { type EditorProps, loader } from '@monaco-editor/react';
import * as monaco from 'monaco-editor';

const BEAK_LIGHT: monaco.editor.IStandaloneThemeData = {
	base: 'vs',
	inherit: true,
	rules: [
		{ token: 'comment', foreground: '6B7280', fontStyle: 'italic' },
		{ token: 'variable.name', foreground: 'B84A6C', fontStyle: 'bold' },
		{ token: 'delimiter', foreground: '9AA1AD' },
		{ token: 'string', foreground: '29A37B' },
		{ token: 'number', foreground: '4646B0' },
		{ token: 'keyword', foreground: 'B84A6C' },
		{ token: 'type', foreground: '2A2A7D' },
		{ token: 'source', foreground: '242838' },
	],
	colors: {
		'editor.background': '#FFFFFF',
		'editor.foreground': '#0B0E18',
		'editor.lineHighlightBackground': '#F7F8FA',
		'editor.lineHighlightBorder': '#00000000',
		'editorLineNumber.foreground': '#C9CED7',
		'editorLineNumber.activeForeground': '#6B7280',
		'editorCursor.foreground': '#D45D80',
		'editor.selectionBackground': '#FCE4EC',
		'editor.inactiveSelectionBackground': '#EFF1F4',
		'editor.findMatchBackground': '#F8C5D2',
		'editor.findMatchHighlightBackground': '#FDF2F5',
		'editorIndentGuide.background1': '#EFF1F4',
		'editorIndentGuide.activeBackground1': '#E2E5EA',
		'editorWhitespace.foreground': '#E2E5EA',
		'editorBracketMatch.background': '#FCE4EC',
		'editorBracketMatch.border': '#D45D80',
		'editorGutter.background': '#FFFFFF',
		'scrollbarSlider.background': '#C9CED755',
		'scrollbarSlider.hoverBackground': '#D45D8077',
		'scrollbarSlider.activeBackground': '#D45D80AA',
	},
};

const BEAK_DARK: monaco.editor.IStandaloneThemeData = {
	base: 'vs-dark',
	inherit: true,
	rules: [
		{ token: 'comment', foreground: '6B7280', fontStyle: 'italic' },
		{ token: 'variable.name', foreground: 'E58399', fontStyle: 'bold' },
		{ token: 'delimiter', foreground: '6B7280' },
		{ token: 'string', foreground: '45D9A5' },
		{ token: 'number', foreground: '8585E5' },
		{ token: 'keyword', foreground: 'E58399' },
		{ token: 'type', foreground: 'B2B2F2' },
		{ token: 'source', foreground: 'EFF1F4' },
	],
	colors: {
		'editor.background': '#141824',
		'editor.foreground': '#F7F8FA',
		'editor.lineHighlightBackground': '#1B1F2C',
		'editor.lineHighlightBorder': '#00000000',
		'editorLineNumber.foreground': '#4A5160',
		'editorLineNumber.activeForeground': '#9AA1AD',
		'editorCursor.foreground': '#D45D80',
		'editor.selectionBackground': '#6E2A4055',
		'editor.inactiveSelectionBackground': '#242838',
		'editor.findMatchBackground': '#963A56',
		'editor.findMatchHighlightBackground': '#4A1B2A',
		'editorIndentGuide.background1': '#242838',
		'editorIndentGuide.activeBackground1': '#363B49',
		'editorWhitespace.foreground': '#363B49',
		'editorBracketMatch.background': '#4A1B2A',
		'editorBracketMatch.border': '#D45D80',
		'editorGutter.background': '#141824',
		'scrollbarSlider.background': '#363B4977',
		'scrollbarSlider.hoverBackground': '#D45D8088',
		'scrollbarSlider.activeBackground': '#D45D80BB',
	},
};

// Modified version of code from https://github.com/microsoft/monaco-editor/issues/2209
const httpLanguageDefinition: monaco.languages.IMonarchLanguage = {
	ignoreCase: true,
	includeLF: true,
	defaultToken: 'source',
	brackets: [],

	tokenizer: {
		root: [[/^(?:[A-Z0-9]+\s)/, 'comment', '@overview']],
		overview: [[/(.+\s)(.*)(\n)$/, ['variable.name', 'source', { token: 'source', next: '@headers' }]]],
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

export function createDefaultOptions(editorPreferences: EditorPreferences): EditorProps['options'] {
	return {
		automaticLayout: true,
		minimap: { enabled: false },
		tabSize: 4,
		fontFamily: '"Fira Code", Source Code Pro, Menlo, Monaco, Consolas, "Courier New", monospace',
		fontSize: editorPreferences.fontSize,
		codeLensFontSize: editorPreferences.fontSize,
		suggestFontSize: editorPreferences.fontSize,
		inlayHints: {
			fontSize: editorPreferences.fontSize,
			fontFamily: '"Fira Code", Source Code Pro, Menlo, Monaco, Consolas, "Courier New", monospace',
		},
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

		monaco.editor.defineTheme('beak-light', BEAK_LIGHT);
		monaco.editor.defineTheme('beak-dark', BEAK_DARK);
	});
}
