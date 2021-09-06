/* eslint-disable @typescript-eslint/no-var-requires */
const CopyPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const path = require('path');
const SentryPlugin = require('@sentry/webpack-plugin');
const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin');
/* eslint-enable @typescript-eslint/no-var-requires */

const environment = process.env.NODE_ENV;
const buildEnvironment = process.env.BUILD_ENVIRONMENT;

const config = {
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
	devtool: environment === 'development' ? 'eval-source-map' : 'source-map',
};

if (buildEnvironment === 'ci') {
	config.plugins.push(new SentryPlugin({
		authToken: process.env.SENTRY_WEBSITE_API_KEY,
		release: process.env.RELEASE_IDENTIFIER,
		project: 'website',
		org: 'beak',
		include: path.join(__dirname, 'dist'),
	}));
}

module.exports = config;
