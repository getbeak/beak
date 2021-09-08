import { BuildOptions } from 'esbuild';
import path from 'path';

import nativeNodeModulesPlugin from './esbuild-plugins/native-node-modules';
// import { node } from './electron-dep-versions';

const environment = process.env.NODE_ENV;

export default {
	platform: 'node',
	target: 'node14.16.0', // electron version target
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
