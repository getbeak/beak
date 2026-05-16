import type { EditorPreferences } from '@beak/common/types/preferences';
import { type EditorProps, loader } from '@monaco-editor/react';
import * as monaco from 'monaco-editor';
import { initializeMode as initializeGraphQlMode } from 'monaco-graphql/initializeMode';

const BEAK_LIGHT: monaco.editor.IStandaloneThemeData = {
	base: 'vs',
	inherit: true,
	rules: [
		{ token: 'comment', foreground: '5F6573', fontStyle: 'italic' },
		// Header keys (in HTTP) — indigo instead of pink so the preview reads
		// as structured info rather than a wall of brand colour. Pink is
		// reserved for `keyword` (verbs, JSON literals) where it earns the
		// attention.
		{ token: 'variable.name', foreground: '3837A0', fontStyle: 'bold' },
		{ token: 'delimiter', foreground: '8E94A2' },
		{ token: 'string', foreground: '16906F' },
		// JSON keys read as neutral structural ink — saves the colour budget
		// for the values themselves (strings green, numbers indigo, etc.).
		{ token: 'string.key.json', foreground: '1A1D27', fontStyle: 'bold' },
		{ token: 'string.value.json', foreground: '16906F' },
		{ token: 'number', foreground: '4644BD' },
		{ token: 'keyword', foreground: 'BB3C68' },
		{ token: 'type', foreground: '3837A0' },
		{ token: 'source', foreground: '1A1D27' },
	],
	colors: {
		// Slightly off-white so the editor is clearly distinct from the
		// surrounding `bg.surface` pane (which is also light). Without this
		// shift the editor reads as a blank canvas and users can't tell it's
		// an interactive surface.
		'editor.background': '#F6F8FA',
		'editor.foreground': '#080A11',
		'editor.lineHighlightBackground': '#ECEFF3',
		'editor.lineHighlightBorder': '#00000000',
		'editorLineNumber.foreground': '#9AA0AB',
		'editorLineNumber.activeForeground': '#3A3F4B',
		'editorCursor.foreground': '#DA4D7C',
		'editor.selectionBackground': '#FBE3EE',
		'editor.inactiveSelectionBackground': '#F0F2F5',
		'editor.findMatchBackground': '#F6C2D7',
		'editor.findMatchHighlightBackground': '#FDF3F7',
		'editorIndentGuide.background1': '#E6E9EE',
		'editorIndentGuide.activeBackground1': '#D2D6DD',
		'editorWhitespace.foreground': '#D2D6DD',
		'editorBracketMatch.background': '#FBE3EE',
		'editorBracketMatch.border': '#DA4D7C',
		'editorGutter.background': '#F6F8FA',
		'scrollbarSlider.background': '#9AA0AB55',
		'scrollbarSlider.hoverBackground': '#DA4D7C77',
		'scrollbarSlider.activeBackground': '#DA4D7CAA',
	},
};

const BEAK_DARK: monaco.editor.IStandaloneThemeData = {
	base: 'vs-dark',
	inherit: true,
	rules: [
		{ token: 'comment', foreground: '5F6573', fontStyle: 'italic' },
		// See BEAK_LIGHT — `variable.name` (HTTP header keys) is recoloured so
		// pink stays a punctuation accent, not a default ink.
		{ token: 'variable.name', foreground: 'BBBBF8', fontStyle: 'bold' },
		{ token: 'delimiter', foreground: '5F6573' },
		{ token: 'string', foreground: '36C896' },
		{ token: 'string.key.json', foreground: 'F0F2F5', fontStyle: 'bold' },
		{ token: 'string.value.json', foreground: '36C896' },
		{ token: 'number', foreground: '9392EE' },
		{ token: 'keyword', foreground: 'E47497' },
		{ token: 'type', foreground: 'BBBBF8' },
		{ token: 'source', foreground: 'F0F2F5' },
	],
	colors: {
		'editor.background': '#0F1219',
		'editor.foreground': '#F8F9FB',
		'editor.lineHighlightBackground': '#14171F',
		'editor.lineHighlightBorder': '#00000000',
		'editorLineNumber.foreground': '#404654',
		'editorLineNumber.activeForeground': '#8E94A2',
		'editorCursor.foreground': '#DA4D7C',
		'editor.selectionBackground': '#6D243F55',
		'editor.inactiveSelectionBackground': '#1A1D27',
		'editor.findMatchBackground': '#952F54',
		'editor.findMatchHighlightBackground': '#481A2A',
		'editorIndentGuide.background1': '#1A1D27',
		'editorIndentGuide.activeBackground1': '#2A2F3B',
		'editorWhitespace.foreground': '#2A2F3B',
		'editorBracketMatch.background': '#481A2A',
		'editorBracketMatch.border': '#DA4D7C',
		'editorGutter.background': '#0F1219',
		'scrollbarSlider.background': '#2A2F3B77',
		'scrollbarSlider.hoverBackground': '#DA4D7C88',
		'scrollbarSlider.activeBackground': '#DA4D7CBB',
	},
};

// Modified version of code from https://github.com/microsoft/monaco-editor/issues/2209
//
// The `content_type` state branches on mime-type and stores the *Monaco
// language id* (not the raw mime) on the parent state via the `.<id>` arg.
// That way `nextEmbedded: '$S2'` resolves to a language Monaco actually knows
// about (`json`, `xml`, …) and the body section gets full syntax
// highlighting. Without the branching, `$S2` would be e.g. `application/json`
// which Monaco can't resolve, and the body would render as plain `source`.
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
				},
			],
		],

		content_type: [
			// JSON family — application/json, application/ld+json, …+json
			[
				/(\s*)([a-z0-9.-]+\/[a-z0-9.-]*\+?json)\b(.*\n)$/,
				['source', { token: 'source', next: '@headers.json' }, 'source'],
			],
			// XML family — application/xml, text/xml, application/atom+xml
			[/(\s*)([a-z0-9.-]+\/[a-z0-9.-]*\+?xml)\b(.*\n)$/, ['source', { token: 'source', next: '@headers.xml' }, 'source']],
			[/(\s*)(text\/html)\b(.*\n)$/, ['source', { token: 'source', next: '@headers.html' }, 'source']],
			[/(\s*)(text\/css)\b(.*\n)$/, ['source', { token: 'source', next: '@headers.css' }, 'source']],
			[
				/(\s*)(text\/javascript|application\/(?:java|ecma)script)\b(.*\n)$/,
				['source', { token: 'source', next: '@headers.javascript' }, 'source'],
			],
			[
				/(\s*)(application\/(?:x-)?yaml|text\/yaml)\b(.*\n)$/,
				['source', { token: 'source', next: '@headers.yaml' }, 'source'],
			],
			[/(\s*)(text\/(?:x-)?markdown)\b(.*\n)$/, ['source', { token: 'source', next: '@headers.markdown' }, 'source']],
			// Unknown mime — drop back to the headers state with no embedded
			// language. Body will render as plain `source`.
			[/(\s*)([a-z0-9.-]+\/[a-z0-9.+-]+)(.*\n)$/, ['source', { token: 'source', next: '@headers' }, 'source']],

			[/./, '@rematch', '@pop'],
		],

		body: [
			[/^.+$/, ''],

			// idk why this is needed, but it doesn't work without it
			[/^eof$/, { token: '@rematch', next: '@pop', nextEmbedded: '@pop' }],
		],
	},
};

/**
 * Map an HTTP Content-Type header value to the Monaco language id that should
 * be used to render bodies of that mime type. Returns `null` when the type is
 * not a known textual format — callers should fall back to the plain `text`
 * editor in that case.
 *
 * Matching is structural rather than exhaustive: structured-suffix mimes like
 * `application/ld+json` or `application/vnd.api+json` are routed to JSON, and
 * `application/atom+xml` is routed to XML. Charset suffixes
 * (`; charset=utf-8`) are stripped before lookup.
 */
export function contentTypeToMonacoLanguage(contentType: string | null | undefined): string | null {
	if (!contentType) return null;
	const head = contentType.split(';')[0]?.trim().toLowerCase();
	if (!head) return null;
	if (head === 'application/json' || head.endsWith('+json')) return 'json';
	if (head === 'application/xml' || head === 'text/xml' || head.endsWith('+xml')) return 'xml';
	if (head === 'text/html') return 'html';
	if (head === 'text/css') return 'css';
	if (head === 'text/javascript' || head === 'application/javascript' || head === 'application/ecmascript') {
		return 'javascript';
	}
	if (head === 'application/yaml' || head === 'text/yaml' || head === 'application/x-yaml') return 'yaml';
	if (head === 'text/markdown' || head === 'text/x-markdown') return 'markdown';
	if (head === 'text/plain') return 'text';
	return null;
}

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

	// Pre-register monaco-graphql's worker at boot, synchronously. Without
	// this, the first time a `language='graphql'` model is created (e.g.
	// opening a GraphQL request) monaco-graphql's auto-validator fires
	// before the per-editor `initializeMode` call has wired the worker —
	// the worker receives `doValidation` and 404s because the handler
	// isn't installed yet. The previous version of this used a dynamic
	// `import('monaco-graphql/initializeMode')`, which resolves *after*
	// React has already mounted the GraphQL editor — losing the race the
	// comment was trying to win. A static import bundles the worker
	// initializer with the main entry so we can stand the worker up
	// before `createRoot.render` is called.
	initializeGraphQlMode({ schemas: [] });

	loader.init().then(monaco => {
		monaco.languages.register({ id: 'http' });
		monaco.languages.setMonarchTokensProvider('http', httpLanguageDefinition);

		monaco.editor.defineTheme('beak-light', BEAK_LIGHT);
		monaco.editor.defineTheme('beak-dark', BEAK_DARK);
	});
}
