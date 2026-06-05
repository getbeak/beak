/* eslint-disable no-process-env */

import fs from 'node:fs';
import path from 'node:path';
import reactPlugin from '@vitejs/plugin-react';
import monacoEditorPlugin from 'vite-plugin-monaco-editor';
import viteSentryPlugin from 'vite-plugin-sentry';

// eslint-disable-next-line no-sync
const packageJson = JSON.parse(
	fs.readFileSync(path.join(__dirname, '..', '..', 'apps-host', 'electron', 'package.json')),
);

const environment = process.env.NODE_ENV;
const versionRelease = Boolean(process.env.VERSION_RELEASE);
const versionIdentifier = packageJson.version;
const commitIdentifier = process.env.COMMIT_IDENTIFIER;
const releaseIdentifier = versionRelease ? `beak-app@${versionIdentifier}` : commitIdentifier;

/**
 * @type {import('vite').UserConfig}
 * @see https://vitejs.dev/config/
 */
export default {
	mode: environment,
	jsx: 'react',
	root: './src',
	base: './',
	publicDir: '../public',
	// Pin the renderer dev server to 5174 (plain HTTP). The web host
	// (apps-host/web) owns 5173 over HTTPS so it can register service
	// workers; the Electron BrowserWindow loads us as a plain frame and
	// would 502 against the web host's TLS-terminated dev server, so they
	// can't share a port.
	server: {
		port: 5174,
		strictPort: true,
		host: '127.0.0.1',
	},
	resolve: {
		alias: {
			'@beak/ui': path.join(__dirname, './src'),
			'@beak/common': path.join(__dirname, '../common/src'),
			'@beak/state': path.join(__dirname, '../state/src'),
			'@beak/runtime-shared': path.join(__dirname, '../runtime-shared/src'),
			'@getbeak/extension-sdk': path.join(__dirname, '../extension-sdk/src'),
			'@beak/design-system': path.join(__dirname, '../design-system/src'),
			'@beak/ksuid': path.join(__dirname, '../ksuid/src'),
			'@beak/squawk': path.join(__dirname, '../squawk/src'),

			'@getbeak/types': path.join(__dirname, '../types/src'),

			path: 'path-browserify',
			'monaco-editor/esm/vs/editor/contrib/hover/browser/hover':
				'monaco-editor/esm/vs/editor/contrib/hover/browser/contentHoverController2',
		},
	},
	plugins: [
		reactPlugin({
			babel: {
				plugins: [['babel-plugin-react-compiler', { target: '19' }]],
			},
		}),
		monacoEditorPlugin.default({
			globalAPI: true,
			languageWorkers: ['json', 'css', 'html', 'typescript', 'editorWorkerService'],
			customWorkers: [
				{
					label: 'graphql',
					entry: '../../../node_modules/monaco-graphql/dist/graphql.worker',
				},
				{
					label: 'scss',
					entry: '../../../node_modules/monaco-editor/esm/vs/language/css/css.worker',
				},
				{
					label: 'less',
					entry: '../../../node_modules/monaco-editor/esm/vs/language/css/css.worker',
				},
				{
					label: 'handlebars',
					entry: '../../../node_modules/monaco-editor/esm/vs/language/html/html.worker',
				},
				{
					label: 'razor',
					entry: '../../../node_modules/monaco-editor/esm/vs/language/html/html.worker',
				},
				{
					label: 'javascript',
					entry: '../../../node_modules/monaco-editor/esm/vs/language/typescript/ts.worker',
				},
			],
		}),
		viteSentryPlugin({
			authToken: process.env.SENTRY_AUTH_TOKEN,
			dryRun: process.env.BUILD_ENVIRONMENT !== 'ci',
			org: 'beak',
			project: 'apps-host-electron',
			release: releaseIdentifier,
			deploy: {
				env: environment,
				url: `https://github.com/getbeak/beak/tree/${commitIdentifier}`,
			},
			sourceMaps: {
				include: ['./dist'],
				urlPrefix: '~/',
			},
			setCommits: {
				auto: true,
			},
		}),
	],
	build: {
		target: 'chrome93',
		outDir: '../dist',
		emptyOutDir: true,
		sourcemap: true,
		assetsDir: '.',
		minify: environment === 'development' ? false : 'esbuild',
		rollupOptions: {
			external: ['electron'],
			output: {
				entryFileNames: '[name].[format].min.js',
				chunkFileNames: '[name].[format].min.js',
				assetFileNames: '[name].[ext]',
			},
		},
		define: {
			'import.meta.env.BUILD_ENVIRONMENT': writeDefinition(process.env.BUILD_ENVIRONMENT),
			'import.meta.env.RELEASE_IDENTIFIER': writeDefinition(releaseIdentifier),
			'import.meta.env.ENVIRONMENT': writeDefinition(environment),
		},
	},
};

function writeDefinition(value) {
	if (value === void 0) return value;

	return `'${value}'`;
}
