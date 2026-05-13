import { Box } from '@chakra-ui/react';
import React from 'react';
import { useState } from 'react';
import { Helmet } from 'react-helmet';

import MeshGradient from '../components/molecules/MeshGradient';
import CreateView from '../features/welcome/components/organisms/CreateView';
import WelcomeView from '../features/welcome/components/organisms/WelcomeView';

export type WelcomeViewType = 'main' | 'create-local';

/**
 * The welcome window's outer shell. Now Chakra-themed: a mesh-gradient
 * backdrop made from the brand palette (pink/teal/indigo) sits behind
 * a draggable region and the inner content. The two-card switcher
 * (`main` / `create-local`) stays exactly the same — the visual change
 * is entirely in the chrome.
 */
const Welcome: React.FC<React.PropsWithChildren<unknown>> = () => {
	const [view, setView] = useState<WelcomeViewType>('main');

	return (
		<Box position='relative' h='100%' bg='bg.canvas'>
			<Helmet defer={false}>
				<title>{'Welcome to Beak - The feathery cross-platform crafting tool'}</title>
			</Helmet>

			<MeshGradient
				position='absolute'
				inset='0'
				tone='welcome'
				intensity={view === 'main' ? 'normal' : 'subtle'}
				transition='opacity 0.5s linear'
			/>

			<Box
				position='absolute'
				top='0'
				left='0'
				right='0'
				h='80px'
				style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
				zIndex={3}
			/>

			<Box
				position='relative'
				px='8'
				pt='10'
				h='calc(100% - 40px)'
				zIndex={2}
			>
				{view === 'main' && <WelcomeView setView={setView} />}
				{view === 'create-local' && <CreateView setView={setView} />}
			</Box>
		</Box>
	);
};

export default Welcome;
