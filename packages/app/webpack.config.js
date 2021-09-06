/* eslint-disable @typescript-eslint/no-var-requires */
const CopyPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MonacoWebpackPlugin = require('monaco-editor-webpack-plugin');
const path = require('path');
const SentryPlugin = require('@sentry/webpack-plugin');
const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin');
const webpack = require('webpack');
/* eslint-enable @typescript-eslint/no-var-requires */

const environment = process.env.NODE_ENV;
const buildEnvironment = process.env.BUILD_ENVIRONMENT;
const MONACO_DIR = path.resolve(__dirname, '../../node_modules/monaco-editor');

const config = {
	target: 'web',
	entry: './src/index.tsx',
	resolve: {
		extensions: ['.ts', '.tsx', '.js'],
		plugins: [
			new TsconfigPathsPlugin(),
		],
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
		}, {
			test: /\.(eot|otf|ttf|woff|woff2)$/,
			include: MONACO_DIR,
			use: 'file-loader',
		}, {
			test: /\.css$/,
			include: MONACO_DIR,
			use: ['style-loader', 'css-loader'],
		}],
	},
	plugins: [
		new HtmlWebpackPlugin({
			template: path.join(__dirname, 'public', 'index.html'),
			filename: 'index.html',
			meta: environment !== 'development' && {
				csp: {
					httpEquiv: 'Content-Security-Policy',
					content: `default-src 'self'; connect-src 'none'`,
				},
			},
		}),
		new CopyPlugin([
			{ from: 'public' },
		]),
		new MonacoWebpackPlugin({
			// available options are documented at https://github.com/Microsoft/monaco-editor-webpack-plugin#options
			languages: ['json', 'javascript', 'typescript'],
			themes: ['vs-dark', 'vs-light'],
		}),
		new webpack.EnvironmentPlugin({
			BUILD_ENVIRONMENT: process.env.BUILD_ENVIRONMENT,
			RELEASE_IDENTIFIER: process.env.RELEASE_IDENTIFIER,
			ENVIRONMENT: process.env.NODE_ENV,
		}),
	],
	devServer: {
		contentBase: path.join(__dirname, 'public'),
		publicPath: '/',
		open: false,
		port: 3000,
	},
	externals: {
		electron: 'electron',
	},
	devtool: environment === 'development' ? 'eval-source-map' : 'source-map',
	optimization: {
		splitChunks: {
			chunks: 'all',
		},
	},
};

if (buildEnvironment === 'ci') {
	config.plugins.push(new SentryPlugin({
		authToken: process.env.SENTRY_ELECTRON_APP_API_KEY,
		release: process.env.RELEASE_IDENTIFIER,
		project: 'electron-app',
		include: path.join(__dirname, 'dist'),
	}));
}

module.exports = config;
