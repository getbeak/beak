/* eslint-disable @typescript-eslint/no-var-requires */
const CopyPlugin = require('copy-webpack-plugin');
const MonacoWebpackPlugin = require('monaco-editor-webpack-plugin');
const path = require('path');
const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
/* eslint-enable @typescript-eslint/no-var-requires */

const environment = process.env.NODE_ENV;
const MONACO_DIR = path.resolve(__dirname, '../../node_modules/monaco-editor');

module.exports = {
	target: 'electron-renderer',
	// target: 'web',
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
		// clean: true,
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
		}),
		new CopyPlugin([
			{ from: 'public' },
		]),
		new MonacoWebpackPlugin({
			// available options are documented at https://github.com/Microsoft/monaco-editor-webpack-plugin#options
			languages: ['json', 'javascript', 'typescript'],
			themes: ['vs-dark', 'vs-light'],
		}),
	],
	devServer: {
		contentBase: path.join(__dirname, 'public'),
		publicPath: '/',
		open: false,
		port: 3000,
	},
	devtool: environment === 'development' ? 'eval-cheap-source-map' : void 0,
	optimization: {
		splitChunks: {
			chunks: 'all',
		},
	},
};
