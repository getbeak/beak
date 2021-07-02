/* eslint-disable no-param-reassign, @typescript-eslint/no-var-requires */

const CopyPlugin = require('copy-webpack-plugin');
const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin');

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
		}],
	},
	plugins: [
		new CopyPlugin([
			{ from: 'src/preload.js', to: 'preload.js' },
		]),
	],
};
