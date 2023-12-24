/* eslint-disable no-process-env */
/* eslint-disable @typescript-eslint/no-var-requires */

const path = require('path');
const fs = require('fs');
const reactPlugin = require('@vitejs/plugin-react');
const viteSentryPlugin = require('vite-plugin-sentry');
const monacoEditorPlugin = require('vite-plugin-monaco-editor');
const mkcert = require('vite-plugin-mkcert');
const { NodeGlobalsPolyfillPlugin } = require('@esbuild-plugins/node-globals-polyfill');

// eslint-disable-next-line no-sync
const packageJson = JSON.parse(fs.readFileSync(path.join(
	__dirname,
	'..', '..',
	'apps-host',
	'electron',
	'package.json',
)));

const environment = process.env.NODE_ENV;
const versionRelease = Boolean(process.env.VERSION_RELEASE);
const versionIdentifier = packageJson.version;
const commitIdentifier = process.env.COMMIT_IDENTIFIER;
const releaseIdentifier = versionRelease ? `beak-app@${versionIdentifier}` : commitIdentifier;
const sourcePathInDev = environment === 'development' ? 'src' : '';

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
			'@beak/apps-host-web': path.join(__dirname, './src'),

			'@beak/ui': path.join(__dirname, `../../packages/ui/${sourcePathInDev}`),
			'@beak/common': path.join(__dirname, '../../packages/common/src'),
			'@beak/common-host': path.join(__dirname, '../../packages/common-host/src'),
			'@beak/design-system': path.join(__dirname, '../../packages/design-system/src'),
			'@beak/ksuid': path.join(__dirname, '../../packages/ksuid/src'),

			'@getbeak/types': path.join(__dirname, '../../packages/types/src'),
			'path': 'path-browserify',
		},
	},
	server: {
		https: true,
	},
	plugins: [
		mkcert.default(),
		reactPlugin({ include: '**/*.tsx' }),
		monacoEditorPlugin.default({
			globalAPI: true,
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
			authToken: process.env.SENTRY_AUTH_TOKEN,
			dryRun: process.env.BUILD_ENVIRONMENT !== 'ci',
			org: 'beak',
			project: 'apps-host-web',
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
	optimizeDeps: {
		esbuildOptions: {
			define: {
				global: 'globalThis',
			},
			plugins: [
				NodeGlobalsPolyfillPlugin({
					buffer: true,
				}),
			],
		},
	},
};

function writeDefinition(value) {
	if (value === void 0)
		return value;

	return `'${value}'`;
}
