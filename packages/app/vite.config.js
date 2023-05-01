/* eslint-disable no-process-env */
/* eslint-disable @typescript-eslint/no-var-requires */

const path = require('path');
const fs = require('fs');
const reactPlugin = require('@vitejs/plugin-react');
const viteSentryPlugin = require('vite-plugin-sentry');
const monacoEditorPlugin = require('vite-plugin-monaco-editor');

// eslint-disable-next-line no-sync
const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, '../', 'electron-host', 'package.json')));

const environment = process.env.NODE_ENV;
const versionRelease = Boolean(process.env.VERSION_RELEASE);
const versionIdentifier = packageJson.version;
const commitIdentifier = process.env.COMMIT_IDENTIFIER;
const releaseIdentifier = versionRelease ? `beak-app@${versionIdentifier}` : commitIdentifier;

const sourcePath = environment === 'development' ? 'src' : 'dist';

/**
 * @type {import('vite').UserConfig}
 * @see https://vitejs.dev/config/
 */
module.exports = {
	mode: environment,
	jsx: 'react',
	root: './src',
	base: './',
	publicDir: '../public',
	resolve: {
		alias: {
			'@beak/app': path.join(__dirname, './src'),
			'@beak/common': path.join(__dirname, `../common/${sourcePath}`),
			'@beak/design-system': path.join(__dirname, `../design-system/${sourcePath}`),

			'@getbeak/types': path.join(__dirname, '../types/src'),
			'path': 'path-browserify',
		},
	},
	plugins: [
		reactPlugin({ include: '**/*.tsx' }),
		monacoEditorPlugin.default({
			languageWorkers: [
				'json',
				'css',
				'html',
				'typescript',
				'editorWorkerService',
			],
			customWorkers: [{
				label: 'graphql',
				entry: '../../../node_modules/monaco-graphql/dist/graphql.worker',
			}, {
				label: 'scss',
				entry: '../../../node_modules/monaco-editor/esm/vs/language/css/css.worker',
			}, {
				label: 'less',
				entry: '../../../node_modules/monaco-editor/esm/vs/language/css/css.worker',
			}, {
				label: 'handlebars',
				entry: '../../../node_modules/monaco-editor/esm/vs/language/html/html.worker',
			}, {
				label: 'razor',
				entry: '../../../node_modules/monaco-editor/esm/vs/language/html/html.worker',
			}, {
				label: 'javascript',
				entry: '../../../node_modules/monaco-editor/esm/vs/language/typescript/ts.worker',
			}],
		}),
		viteSentryPlugin({
			authToken: process.env.SENTRY_ELECTRON_APP_API_KEY,
			dryRun: process.env.BUILD_ENVIRONMENT !== 'ci',
			org: 'beak',
			project: 'electron-app',
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
	if (value === void 0)
		return value;

	return `'${value}'`;
}
