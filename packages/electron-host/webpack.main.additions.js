/* eslint-disable no-param-reassign, @typescript-eslint/no-var-requires */

const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin');

const production = process.env.NODE_ENV === 'production';
const productionNativeModuleOptions = {
	basePath: ['dist', 'main'],
};

module.exports = {
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
};
