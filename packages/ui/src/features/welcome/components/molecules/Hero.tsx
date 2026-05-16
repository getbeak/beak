import { Box, Flex } from '@chakra-ui/react';
import { ipcExplorerService } from '@beak/ui/lib/ipc';
import { motion } from 'framer-motion';
import { BookOpen, Sparkles, Zap } from 'lucide-react';
import * as React from 'react';

import MeshGradient from '../../../../components/molecules/MeshGradient';
import Button from '../../../../components/atoms/Button';

interface HeroProps {
	onPrimary: () => void;
}

const Hero: React.FC<HeroProps> = ({ onPrimary }) => (
	<Box
		position='relative'
		borderRadius='xl'
		overflow='hidden'
		borderWidth='1px'
		borderColor='border.subtle'
		boxShadow='0 24px 64px rgba(0,0,0,0.25)'
	>
		<MeshGradient
			position='absolute'
			inset='0'
			tone='welcome'
			intensity='strong'
			pointerEvents='none'
		/>
		<Box
			position='absolute'
			inset='0'
			pointerEvents='none'
			css={{
				background:
					'linear-gradient(105deg, rgba(8,10,20,0.72) 0%, rgba(8,10,20,0.55) 45%, rgba(8,10,20,0.20) 100%)',
			}}
		/>

		<Box position='relative' px={{ base: '5', md: '8' }} py={{ base: '5', md: '7' }} maxW='620px'>
			<motion.div
				initial={{ opacity: 0, y: 6 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.35, ease: 'easeOut' }}
			>
				<Flex
					align='center'
					gap='1.5'
					mb='2'
					color='white'
					opacity={0.9}
					fontSize='10px'
					fontWeight='700'
					letterSpacing='0.12em'
					textTransform='uppercase'
				>
					<Sparkles size={12} />
					{'Welcome to Beak'}
				</Flex>
				<Box
					as='h1'
					color='white'
					fontSize={{ base: '2xl', md: '3xl' }}
					fontWeight='700'
					lineHeight='1.1'
					letterSpacing='-0.02em'
					mb='2'
				>
					{'Craft, test, and ship beautiful API requests.'}
				</Box>
				<Box
					color='white'
					opacity={0.85}
					fontSize={{ base: 'xs', md: 'sm' }}
					lineHeight='1.5'
					maxW='480px'
					mb='4'
				>
					{'Pick up where you left off, start fresh, or pull a Git repo down to work with.'}
				</Box>
				<Flex gap='2.5' wrap='wrap'>
					<Button onClick={onPrimary}>
						<Flex align='center' gap='1.5'>
							<Zap size={13} />
							{'Send your first request'}
						</Flex>
					</Button>
					<Button
						colour='secondary'
						onClick={() => ipcExplorerService.launchUrl('https://docs.getbeak.app/')}
						style={{
							background: 'rgba(255,255,255,0.14)',
							color: 'white',
							borderColor: 'rgba(255,255,255,0.5)',
							backdropFilter: 'blur(8px)',
							boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.18)',
						}}
					>
						<Flex align='center' gap='1.5'>
							<BookOpen size={13} />
							{'Read the docs'}
						</Flex>
					</Button>
				</Flex>
			</motion.div>
		</Box>
	</Box>
);

export default Hero;
