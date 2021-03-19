/* eslint-disable @typescript-eslint/no-var-requires */
const CopyPlugin = require('copy-webpack-plugin');
const path = require('path');
const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin');
/* eslint-enable @typescript-eslint/no-var-requires */

module.exports = {
	entry: './src/index.tsx',
	resolve: {
		extensions: ['.ts', '.tsx', '.js'],
		plugins: [
			new TsconfigPathsPlugin(),
		],
		alias: {
			'@beak/design-system': path.resolve(__dirname, '../design-system/src'),
		},
	},
	output: {
		path: path.join(__dirname, 'dist'),
		publicPath: './',
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
		publicPath: '/',
		open: false,
		port: 3000,
	},
	devtool: 'eval-cheap-source-map',
};
