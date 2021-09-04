/* eslint-disable no-param-reassign, @typescript-eslint/no-var-requires */

const CopyPlugin = require('copy-webpack-plugin');
const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin');

const production = process.env.NODE_ENV === 'production';
const productionNativeModuleOptions = {
	basePath: ['dist', 'main'],
};

module.exports = {
	target: 'electron-main',
	resolve: {
		extensions: ['.ts'],
		plugins: [
			new TsconfigPathsPlugin(),
		],
	},
	module: {
		rules: [{
			test: /\.ts$/,
			loader: 'ts-loader',
			options: {
				projectReferences: true,
			},
		}, {
			test: /\.node$/,
			loader: 'native-ext-loader',
			options: production ? productionNativeModuleOptions : void 0,
		}],
	},
	plugins: [
		new CopyPlugin([
			{ from: 'src/preload.js', to: 'preload.js' },
		]),
	],
};
