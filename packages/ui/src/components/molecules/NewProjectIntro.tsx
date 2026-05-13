import { Box, Flex, SimpleGrid, chakra } from '@chakra-ui/react';
import { ipcExplorerService } from '@beak/ui/lib/ipc';
import { motion } from 'framer-motion';
import { ArrowUpRight, BookOpen, GitBranch, Hash, Layers, Sparkles, Zap } from 'lucide-react';
import * as React from 'react';

import { useDefaultOrCreateRequest } from '../../hooks/use-default-or-create-request';
import Button from '../atoms/Button';
import MeshGradient from './MeshGradient';

const NewProjectIntro: React.FC = () => {
	const defaultOrCreateRequest = useDefaultOrCreateRequest();

	return (
		<Box
			position='relative'
			h='100%'
			w='100%'
			bg='bg.canvas'
			overflowY='auto'
		>
			<Flex direction='column' align='stretch' maxW='900px' mx='auto' px={{ base: '5', md: '8' }} py='10'>
				{/* Hero card with the WebGL mesh shader as backdrop */}
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
					{/* Darken layer so text always has contrast over the shader */}
					<Box
						position='absolute'
						inset='0'
						pointerEvents='none'
						css={{
							background:
								'linear-gradient(160deg, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0.25) 50%, rgba(0,0,0,0.55) 100%)',
						}}
					/>

					<Box position='relative' px={{ base: '6', md: '10' }} py={{ base: '10', md: '14' }} maxW='620px'>
						<motion.div
							initial={{ opacity: 0, y: 6 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.35, ease: 'easeOut' }}
						>
							<Flex
								align='center'
								gap='1.5'
								mb='3'
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
								fontSize={{ base: '3xl', md: '4xl' }}
								fontWeight='700'
								lineHeight='1.05'
								letterSpacing='-0.02em'
								mb='3'
							>
								{'Craft, test, and ship'}
								<br />
								{'beautiful API requests.'}
							</Box>
							<Box
								color='white'
								opacity={0.85}
								fontSize={{ base: 'sm', md: 'md' }}
								lineHeight='1.55'
								maxW='480px'
								mb='6'
							>
								{'A comprehensive toolkit for building, editing, testing, and exploring APIs. '}
								{'Send your first request in seconds, or wander through the guides below.'}
							</Box>
							<Flex gap='2.5' wrap='wrap'>
								<Button onClick={defaultOrCreateRequest}>
									<Flex align='center' gap='1.5'>
										<Zap size={13} />
										{'Send your first request'}
									</Flex>
								</Button>
								<Button
									colour='secondary'
									onClick={() => ipcExplorerService.launchUrl('https://docs.getbeak.app/')}
									style={{
										background: 'rgba(255,255,255,0.08)',
										color: 'white',
										borderColor: 'rgba(255,255,255,0.35)',
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

				{/* Guide grid */}
				<Box mt='10'>
					<Flex
						align='center'
						gap='1.5'
						mb='4'
						color='fg.subtle'
						fontSize='10px'
						fontWeight='700'
						letterSpacing='0.08em'
						textTransform='uppercase'
					>
						<BookOpen size={11} />
						{'Learn'}
					</Flex>
					<SimpleGrid columns={{ base: 1, md: 2 }} gap='4'>
						<GuideCard
							icon={BookOpen}
							title='Documentation'
							body='Read and explore all the features Beak has to offer.'
							cta='View the manual'
							url='https://docs.getbeak.app/'
						/>
						<GuideCard
							icon={Layers}
							title='Variable sets'
							body='Share common variables between requests and switch between environments instantly.'
							cta='Read about variable sets'
							url='https://getbeak.notion.site/Variable-sets-b5e2083aa597496b89006e1a48acf5fb?pvs=74'
						/>
						<GuideCard
							icon={GitBranch}
							title='Versioning'
							body='Sync changes to your Beak project with your team via plain Git — no proprietary cloud.'
							cta='Read about versioning'
							url='https://getbeak.notion.site/Source-control-versioning-aa9b4d423e614148a10f69d42b3bc746'
						/>
						<GuideCard
							icon={Hash}
							title='Variables'
							body='Inject dynamic values into any request — recomputed every send.'
							cta='Read about variables'
							url='https://www.notion.so/getbeak/Variables-e569e07fec964859926edcab2a3351ac'
						/>
					</SimpleGrid>
				</Box>
			</Flex>
		</Box>
	);
};

interface GuideCardProps {
	icon: React.ComponentType<{ size?: number }>;
	title: string;
	body: string;
	cta: string;
	url: string;
}

const ChakraButton = chakra('button');

const GuideCard: React.FC<GuideCardProps> = ({ icon: Icon, title, body, cta, url }) => (
	<ChakraButton
		type='button'
		display='block'
		textAlign='left'
		w='100%'
		p='4'
		borderRadius='lg'
		borderWidth='1px'
		borderColor='border.subtle'
		bg='bg.surface'
		cursor='pointer'
		transition='border-color .14s ease, background-color .14s ease, transform .08s ease'
		_hover={{
			borderColor: 'accent.pink',
			bg: 'color-mix(in srgb, var(--beak-colors-accent-pink) 6%, var(--beak-colors-bg-surface))',
		}}
		_active={{ transform: 'scale(0.99)' }}
		_focus={{
			outline: 'none',
			borderColor: 'accent.pink',
			boxShadow: '0 0 0 3px color-mix(in srgb, var(--beak-colors-accent-pink) 28%, transparent)',
		}}
		onClick={() => ipcExplorerService.launchUrl(url)}
	>
		<Flex align='flex-start' gap='3'>
			<Flex
				flex='0 0 auto'
				align='center'
				justify='center'
				w='32px'
				h='32px'
				borderRadius='md'
				bg='color-mix(in srgb, var(--beak-colors-accent-pink) 14%, transparent)'
				color='accent.pink'
			>
				<Icon size={15} />
			</Flex>
			<Box flex='1 1 auto' minW={0}>
				<Box fontSize='sm' fontWeight='600' color='fg.default' mb='1'>
					{title}
				</Box>
				<Box fontSize='xs' color='fg.muted' lineHeight='1.45' mb='2'>
					{body}
				</Box>
				<Flex align='center' gap='1' color='accent.pink' fontSize='xs' fontWeight='600'>
					{cta}
					<ArrowUpRight size={11} />
				</Flex>
			</Box>
		</Flex>
	</ChakraButton>
);

export default NewProjectIntro;
