import { Box, Flex, Image } from '@chakra-ui/react';
import { renderPlainTextDefinition } from '@beak/ui/utils/keyboard-rendering';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import * as React from 'react';
import { useEffect, useState } from 'react';

import MeshGradient from './MeshGradient';

const ProjectLoading: React.FC = () => {
	const reduced = useReducedMotion();
	const hints: string[] = [
		`Collapse the sidebar by pressing ${renderPlainTextDefinition('sidebar.toggle-view')}`,
		'Variables make request bodies dynamic',
		`Open the command bar with ${renderPlainTextDefinition('omni-bar.launch.commands')}`,
		`Find any request fast with ${renderPlainTextDefinition('omni-bar.launch.finder')}`,
		'Keep an eye out for easter eggs…',
		`Run the current request from anywhere with ${renderPlainTextDefinition('global.execute-request')}`,
		'Customize Beak in Preferences',
		'Beak speaks GraphQL — write queries and inject variables',
	];

	const [hintIndex, setHintIndex] = useState<number>(() => Math.floor(Math.random() * hints.length));

	useEffect(() => {
		const id = window.setInterval(() => {
			setHintIndex(i => (i + 1) % hints.length);
		}, 3500);
		return () => window.clearInterval(id);
	}, [hints.length]);

	return (
		<Flex
			role='status'
			aria-live='polite'
			aria-label='Loading project'
			position='absolute'
			inset='0'
			zIndex={100}
			align='center'
			justify='center'
			textAlign='center'
			bg='bg.canvas'
			style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
		>
			<MeshGradient position='absolute' inset='0' tone='loading' intensity='subtle' pointerEvents='none' />
			<Box position='relative'>
				<motion.div
					initial={{ opacity: 0, scale: 0.96 }}
					animate={{ opacity: 1, scale: 1 }}
					transition={{ duration: 0.3, ease: 'easeOut' }}
				>
					<Image
						w='64px'
						mx='auto'
						src='images/logo-tile.png'
						mb='5'
						filter='drop-shadow(0px 8px 24px color-mix(in srgb, var(--beak-colors-accent-pink) 40%, transparent))'
						style={reduced ? undefined : {
							animation: 'beakLogoFloat 4s ease-in-out infinite',
						}}
					/>
				</motion.div>
				<Flex
					align='center'
					justify='center'
					gap='1.5'
					textTransform='uppercase'
					fontSize='10px'
					fontWeight='700'
					letterSpacing='0.08em'
					color='accent.pink'
				>
					<Box
						w='18px'
						h='1px'
						bg='linear-gradient(to right, transparent, color-mix(in srgb, var(--beak-colors-accent-pink) 55%, transparent))'
					/>
					{'Did you know?'}
					<Box
						w='18px'
						h='1px'
						bg='linear-gradient(to left, transparent, color-mix(in srgb, var(--beak-colors-accent-pink) 55%, transparent))'
					/>
				</Flex>
				<Box mt='2' minH='44px' maxW='340px' mx='auto'>
					<AnimatePresence mode='wait'>
						<motion.div
							key={hintIndex}
							initial={{ opacity: 0, y: 4 }}
							animate={{ opacity: 1, y: 0 }}
							exit={{ opacity: 0, y: -4 }}
							transition={{ duration: 0.22, ease: 'easeOut' }}
						>
							<Box fontSize='sm' lineHeight='1.5' color='fg.muted'>
								{hints[hintIndex]}
							</Box>
						</motion.div>
					</AnimatePresence>
				</Box>
			</Box>
		</Flex>
	);
};

export default ProjectLoading;
