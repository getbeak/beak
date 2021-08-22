/* eslint-disable @typescript-eslint/no-var-requires */
const CopyPlugin = require('copy-webpack-plugin');
const path = require('path');
const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
/* eslint-enable @typescript-eslint/no-var-requires */

const environment = process.env.NODE_ENV;

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
		publicPath: '/',
		filename: '[name].[hash].js',
		chunkFilename: '[name].[hash].js',
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
		new HtmlWebpackPlugin({
			template: path.join(__dirname, 'public', 'index.html'),
			filename: 'index.html',
		}),
	],
	devServer: {
		historyApiFallback: true,
		publicPath: '/',
		contentBase: path.resolve(__dirname, 'public'),
		port: 3000,
	},
	optimization: {
		splitChunks: {
			chunks: 'all',
		},
	},
	devtool: environment === 'development' ? 'eval-cheap-source-map' : void 0,
};
