/* eslint-disable @typescript-eslint/no-var-requires */

const path = require('path');
const reactRefresh = require('@vitejs/plugin-react-refresh');
const viteSentryPlugin = require('vite-plugin-sentry');

const environment = process.env.NODE_ENV;
const commitIdentifier = process.env.COMMIT_IDENTIFIER;
const releaseIdentifier = commitIdentifier;

/**
 * @type {import('vite').UserConfig}
 * @see https://vitejs.dev/config/
 */
module.exports = {
	mode: environment,
	jsx: 'react',
	root: './src',
	publicDir: '../public',
	resolve: {
		alias: {
			'@beak/share': path.join(__dirname, './src'),
			'@beak/common': path.join(__dirname, '../common/src'),
			'@beak/design-system': path.join(__dirname, '../design-system/src'),
		},
	},
	plugins: [
		reactRefresh({ include: '**/*.tsx' }),
		viteSentryPlugin({
			authToken: process.env.SENTRY_WEBSITE_API_KEY,
			dryRun: process.env.BUILD_ENVIRONMENT !== 'ci',
			org: 'beak',
			project: 'share',
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
		target: 'modules',
		outDir: '../dist',
		emptyOutDir: true,
		sourcemap: true,
		assetsDir: '.',
		minify: environment === 'development' ? false : 'terser',
		rollupOptions: {
			external: ['electron'],
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
