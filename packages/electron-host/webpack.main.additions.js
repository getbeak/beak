/* eslint-disable no-param-reassign, @typescript-eslint/no-var-requires */

const SentryPlugin = require('@sentry/webpack-plugin');
const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin');
const webpack = require('webpack');

const environment = process.env.NODE_ENV;
const production = environment === 'production';
const buildEnvironment = process.env.BUILD_ENVIRONMENT;
const productionNativeModuleOptions = {
	basePath: ['dist', 'main'],
};

const config = {
	target: 'electron-main',
	resolve: {
		extensions: ['.ts', '.js'],
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
		new webpack.EnvironmentPlugin({
			BUILD_ENVIRONMENT: process.env.BUILD_ENVIRONMENT,
			RELEASE_IDENTIFIER: process.env.RELEASE_IDENTIFIER,
			ENVIRONMENT: process.env.NODE_ENV,
		}),
	],
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
