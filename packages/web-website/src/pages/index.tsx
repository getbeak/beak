import * as React from 'react';
import type { HeadFC, PageProps } from 'gatsby';

import AppContainer from '../containers/AppContainer';
import Home from '../features/home/components/Home';

const IndexPage: React.FC<PageProps> = () => (
	<AppContainer>
		<Home />
	</AppContainer>
);

export default IndexPage;

export const Head: HeadFC = () => (
	<React.Fragment>
		<title>{'Beak :: The feathery cross platform API crafting tool'}</title>

		{/* Preload header images */}
		<link
			as={'image'}
			rel={'preload'}
			type={'image/webp'}
			crossOrigin={'anonymous'}
			href={'/images/home-trans-light.webp'}
			media={'(prefers-color-scheme: light)'}
		/>
		<link
			as={'image'}
			rel={'preload'}
			type={'image/webp'}
			crossOrigin={'anonymous'}
			href={'/images/home-trans-dark.webp'}
			media={'(prefers-color-scheme: dark)'}
		/>
	</React.Fragment>
);
