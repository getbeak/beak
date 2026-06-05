import { ipcExplorerService } from '@beak/ui/lib/ipc';
import { Box, chakra, Flex, SimpleGrid } from '@chakra-ui/react';
import { motion } from 'framer-motion';
import { ArrowUpRight, BookOpen, GitBranch, Hash, Layers } from 'lucide-react';
import * as React from 'react';

interface GuideCardProps {
	idx: number;
	icon: React.ComponentType<{ size?: number }>;
	title: string;
	body: string;
	cta: string;
	url: string;
}

const ChakraButton = chakra('button');
const MotionDiv = motion.div;

const LearnGrid: React.FC = () => (
	<Box>
		<Flex
			align='center'
			gap='1.5'
			mb='2.5'
			color='fg.subtle'
			fontSize='10px'
			fontWeight='700'
			letterSpacing='0.08em'
			textTransform='uppercase'
		>
			<BookOpen size={11} />
			{'Learn'}
		</Flex>
		<SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} gap='2.5'>
			<GuideCard
				idx={0}
				icon={BookOpen}
				title='Documentation'
				body='Read and explore all the features Beak has to offer.'
				cta='View the manual'
				url='https://docs.getbeak.app/'
			/>
			<GuideCard
				idx={1}
				icon={Layers}
				title='Variable sets'
				body='Share common variables between requests and switch between environments instantly.'
				cta='Read about variable sets'
				url='https://getbeak.notion.site/Variable-sets-b5e2083aa597496b89006e1a48acf5fb?pvs=74'
			/>
			<GuideCard
				idx={2}
				icon={GitBranch}
				title='Versioning'
				body='Sync changes to your Beak project with your team via plain Git — no proprietary cloud.'
				cta='Read about versioning'
				url='https://getbeak.notion.site/Source-control-versioning-aa9b4d423e614148a10f69d42b3bc746'
			/>
			<GuideCard
				idx={3}
				icon={Hash}
				title='Variables'
				body='Inject dynamic values into any request — recomputed every send.'
				cta='Read about variables'
				url='https://www.notion.so/getbeak/Variables-e569e07fec964859926edcab2a3351ac'
			/>
		</SimpleGrid>
	</Box>
);

const GuideCard: React.FC<GuideCardProps> = ({ idx, icon: Icon, title, body, cta, url }) => (
	<MotionDiv
		initial={{ opacity: 0, y: 12 }}
		animate={{ opacity: 1, y: 0 }}
		transition={{ duration: 0.32, ease: 'easeOut', delay: 0.18 + idx * 0.06 }}
		style={{ display: 'flex', width: '100%', height: '100%' }}
	>
		<ChakraButton
			type='button'
			display='flex'
			flexDirection='column'
			alignItems='stretch'
			justifyContent='flex-start'
			textAlign='left'
			w='100%'
			h='100%'
			p='3'
			borderRadius='lg'
			borderWidth='1px'
			borderColor='border.subtle'
			bg='bg.surface'
			cursor='pointer'
			transition='border-color .14s ease, background-color .14s ease, transform .08s ease, box-shadow .14s ease'
			_hover={{
				borderColor: 'accent.pink',
				bg: 'color-mix(in srgb, var(--beak-colors-accent-pink) 4%, var(--beak-colors-bg-surface))',
				transform: 'translateY(-1px)',
				boxShadow: '0 4px 12px color-mix(in srgb, var(--beak-colors-accent-pink) 7%, rgba(0,0,0,0.04))',
			}}
			_active={{ transform: 'translateY(-1px) scale(0.99)' }}
			_focusVisible={{
				outline: 'none',
				borderColor: 'accent.pink',
				boxShadow: '0 0 0 3px color-mix(in srgb, var(--beak-colors-accent-pink) 28%, transparent)',
			}}
			onClick={() => ipcExplorerService.launchUrl(url)}
		>
			<Flex align='flex-start' gap='2.5'>
				<Flex
					flex='0 0 auto'
					align='center'
					justify='center'
					w='30px'
					h='30px'
					borderRadius='md'
					bg='color-mix(in srgb, var(--beak-colors-accent-pink) 14%, transparent)'
					borderWidth='1px'
					borderColor='color-mix(in srgb, var(--beak-colors-accent-pink) 28%, transparent)'
					color='accent.pink'
					boxShadow='inset 0 1px 0 color-mix(in srgb, white 14%, transparent)'
				>
					<Icon size={14} />
				</Flex>
				<Box flex='1 1 auto' minW={0}>
					<Box fontSize='sm' fontWeight='600' color='fg.default' letterSpacing='-0.005em' mb='0.5'>
						{title}
					</Box>
					<Box fontSize='xs' color='fg.muted' lineHeight='1.45' mb='1.5'>
						{body}
					</Box>
					<Flex
						align='center'
						gap='1'
						color='accent.pink'
						fontSize='xs'
						fontWeight='600'
						css={{
							'a:hover & svg, button:hover & svg': {
								transform: 'translate(1.5px, -1.5px)',
							},
							'& svg': {
								transition: 'transform .14s cubic-bezier(.4,0,.2,1)',
							},
						}}
					>
						{cta}
						<ArrowUpRight size={11} />
					</Flex>
				</Box>
			</Flex>
		</ChakraButton>
	</MotionDiv>
);

export default LearnGrid;
