import type { GatsbyConfig } from 'gatsby';
import path from 'path';

const config: GatsbyConfig = {
	siteMetadata: {
		title: 'Beak',
		siteUrl: 'https://getbeak.app/',
	},
	plugins: [
		'gatsby-plugin-styled-components',
		'gatsby-plugin-image',
		'gatsby-plugin-sitemap',
		'gatsby-plugin-sharp',
		'gatsby-transformer-sharp', {
			resolve: 'gatsby-plugin-manifest',
			options: {
				icon: 'static/images/logo.svg',
			},
		}, {
			resolve: 'gatsby-source-filesystem',
			options: {
				name: 'images',
				path: `${__dirname}/static/images`,
				fastHash: true,
			},
		}, {
			resolve: 'gatsby-plugin-alias-imports',
			options: {
				alias: {
					'@beak/web-website': path.join(__dirname, 'src'),
				},
				extensions: [],
			},
		},
	],
};

export default config;
