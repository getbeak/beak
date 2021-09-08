import { BuildOptions, PluginBuild } from 'esbuild';
import path from 'path';

// import { node } from './electron-dep-versions';

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

const environment = process.env.NODE_ENV;

export default {
	platform: 'node',
	target: 'node14.16.0', // TODO(afr): electron version target
	bundle: true,
	entryPoints: [
		path.resolve('src/main.ts'),
		path.resolve('src/preload.ts'),
	],
	plugins: [nativeNodeModulesPlugin],
	define: {
		'process.env.BUILD_ENVIRONMENT': writeDefinition(process.env.BUILD_ENVIRONMENT),
		'process.env.RELEASE_IDENTIFIER': writeDefinition(process.env.RELEASE_IDENTIFIER),
		'process.env.ENVIRONMENT': writeDefinition(environment),
	},
	sourcemap: 'external',
	assetNames: '[name]',
} as BuildOptions;

function writeDefinition(value: string | undefined) {
	if (value === void 0)
		return value;

	return `'${value}'`;
}
