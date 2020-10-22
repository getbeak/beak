/* eslint-disable @typescript-eslint/no-var-requires */
const CopyPlugin = require('copy-webpack-plugin');
const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin');
const path = require('path');
/* eslint-enable @typescript-eslint/no-var-requires */

module.exports = {
	target: 'electron-renderer',
	entry: './src/index.tsx',
	resolve: {
		extensions: ['.ts', '.tsx', '.js'],
		plugins: [
			new TsconfigPathsPlugin(),
		],
	},
	output: {
		path: path.join(__dirname, 'dist'),
		publicPath: 'public',
		filename: 'bundle.min.js',
	},
	module: {
		rules: [{
			test: /\.tsx?$/,
			loader: 'ts-loader',
			options: {
				projectReferences: true,
			},
		}],
	},
	plugins: [
		new CopyPlugin([
			{ from: 'public' },
		]),
	],
	devServer: {
		// contentBase: path.join(__dirname, 'dist'),
		publicPath: '/',
		open: false,
		port: 3000,
	},
};
