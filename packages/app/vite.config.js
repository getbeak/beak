/* eslint-disable @typescript-eslint/no-var-requires */

const path = require('path');
const reactRefresh = require('@vitejs/plugin-react-refresh');
const viteSentryPlugin = require('vite-plugin-sentry');

// @ts-ignore
const packageJson = require('../electron-host/package.json');

const environment = process.env.NODE_ENV;
const versionRelease = Boolean(process.env.VERSION_RELEASE);
const versionIdentifier = packageJson.version;
const commitIdentifier = process.env.COMMIT_IDENTIFIER;
const releaseIdentifier = versionRelease ? `beak-app@${versionIdentifier}` : commitIdentifier;

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
			'@beak/common': path.join(__dirname, '../common/src'),
			'@beak/design-system': path.join(__dirname, '../design-system/src'),
		},
	},
	plugins: [
		reactRefresh({ include: '**/*.tsx' }),
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
		minify: environment === 'development' ? false : 'terser',
		rollupOptions: {
			external: ['electron'],
			output: {
				entryFileNames: '[name].[format].min.js',
				chunkFileNames: '[name].[format].min.js',
				assetFileNames: '[name].[ext]',
			},
		},
		define: {
			'process.env.BUILD_ENVIRONMENT': writeDefinition(process.env.BUILD_ENVIRONMENT),
			'process.env.RELEASE_IDENTIFIER': writeDefinition(releaseIdentifier),
			'process.env.ENVIRONMENT': writeDefinition(environment),
		},
	},
};

function writeDefinition(value) {
	if (value === void 0)
		return value;

	return `'${value}'`;
}
