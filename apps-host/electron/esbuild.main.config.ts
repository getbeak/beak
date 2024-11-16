/* eslint-disable no-process-env */
import SentryCli from '@sentry/cli';
import type { BuildOptions, PluginBuild } from 'esbuild';
import fs from 'fs/promises';
import { createRequire } from 'module';
import path from 'path';

const require = createRequire(import.meta.url);

const packageJson = require('./package.json');

const environment = process.env.NODE_ENV;
const versionRelease = Boolean(process.env.VERSION_RELEASE);
const versionIdentifier = packageJson.version;
const commitIdentifier = process.env.COMMIT_IDENTIFIER;
const releaseIdentifier = versionRelease ? `beak-app@${versionIdentifier}` : commitIdentifier;

// Thank you Evan
// https://github.com/evanw/esbuild/issues/1051#issuecomment-806325487
const nativeNodeModulesPlugin = {
	name: 'native-node-modules',
	setup(build: PluginBuild) {
		// If a ".node" file is imported within a module in the "file" namespace, resolve
		// it to an absolute path and put it into the "node-file" virtual namespace.
		build.onResolve({ filter: /\.node$/, namespace: 'file' }, args => ({
			path: require.resolve(args.path, { paths: [args.resolveDir] }),
			namespace: 'node-file',
		}));

		// Files in the "node-file" virtual namespace call "require()" on the
		// path from esbuild of the ".node" file in the output directory.
		build.onLoad({ filter: /.*/, namespace: 'node-file' }, args => ({
			contents: `
import path from ${JSON.stringify(args.path)}
try { module.exports = require(path) }
catch {}
`.trimStart(),
		}));

		// If a ".node" file is imported within a module in the "node-file" namespace, put
		// it in the "file" namespace where esbuild's default loading behavior will handle
		// it. It is already an absolute path since we resolved it to one above.
		build.onResolve({ filter: /\.node$/, namespace: 'node-file' }, args => ({
			path: args.path,
			namespace: 'file',
		}));

		// Tell esbuild's default loading behavior to use the "file" loader for
		// these ".node" files.
		const opts = build.initialOptions;

		opts.loader = opts.loader || {};
		opts.loader['.node'] = 'file';
	},
};

const sentrySourceMapsPlugin = {
	name: 'sentry-source-maps',
	setup: (build: PluginBuild) => {
		// Needs to be set again, electron-esbuild overrides it. stupid.
		// eslint-disable-next-line no-param-reassign
		build.initialOptions.sourcemap = true;

		build.onEnd(async () => {
			if (process.env.BUILD_ENVIRONMENT !== 'ci') {
				// Don't do anything if not in CI

				return;
			}

			const cli = new SentryCli(null, {
				authToken: process.env.SENTRY_AUTH_TOKEN,
				org: 'beak',
				project: 'apps-host-electron',
			});

			await cli.releases.new(releaseIdentifier!);
			await cli.releases.uploadSourceMaps(releaseIdentifier!, {
				include: ['./dist'],
				urlPrefix: '~/',
			});
			await cli.releases.setCommits(releaseIdentifier!, { auto: true });
			await cli.releases.newDeploy(releaseIdentifier!, {
				env: environment!,
				url: `https://github.com/getbeak/beak/tree/${commitIdentifier}`,
			});

			await cli.releases.finalize(releaseIdentifier!);
		});
	},
};

const handleVm2Plugin = {
	name: 'handle-vm2',
	setup: (build: PluginBuild) => {
		build.onEnd(async () => {
			const outDir = build.initialOptions.outdir!;
			const vm2Dir = path.join(outDir, '../../../../node_modules/vm2/lib/');
			const bridge = path.join(vm2Dir, 'bridge.js');
			const setupSandbox = path.join(vm2Dir, 'setup-sandbox.js');
			const setupNodeSandbox = path.join(vm2Dir, 'setup-node-sandbox.js');

			await Promise.all([
				fs.copyFile(bridge, path.join(outDir, 'bridge.js')),
				fs.copyFile(setupSandbox, path.join(outDir, 'setup-sandbox.js')),
				fs.copyFile(setupNodeSandbox, path.join(outDir, 'setup-node-sandbox.js')),
			]);
		});
	},
};

export default [{
	platform: 'node',
	target: 'node18.12.1', // TODO(afr): automatic electron version target
	bundle: true,
	format: 'cjs',
	minify: environment !== 'development',
	entryPoints: [
		path.resolve('src/main.ts'),
		path.resolve('src/preload.ts'),
	],
	plugins: [
		nativeNodeModulesPlugin,
		sentrySourceMapsPlugin,
		handleVm2Plugin,
	],
	define: {
		'process.env.BUILD_ENVIRONMENT': writeDefinition(process.env.BUILD_ENVIRONMENT),
		'process.env.RELEASE_IDENTIFIER': writeDefinition(releaseIdentifier),
		'process.env.ENVIRONMENT': writeDefinition(environment),
	},
	sourcemap: true,
	assetNames: '[name]',
	external: ['node:fs'],
}] as BuildOptions[];

function writeDefinition(value: string | undefined) {
	if (value === void 0)
		return value;

	return `'${value}'`;
}
