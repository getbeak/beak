import type { RecentProject } from '@beak/common/types/beak-hub';
import { Box, Flex, chakra } from '@chakra-ui/react';
import { motion } from 'framer-motion';
import { Clock, FolderGit2, FolderOpen, History } from 'lucide-react';
import * as React from 'react';

import { ipcProjectService } from '../../../../lib/ipc';
import { useRecentProjects } from '../../hooks/use-recent-projects';
import { basename, formatRelative, shortenPath } from '../../lib/format-relative';

const MAX_VISIBLE = 6;

const ChakraButton = chakra('button');
const MotionDiv = motion.div;

interface RecentsListProps {
	embedded: boolean;
}

const RecentsList: React.FC<RecentsListProps> = ({ embedded }) => {
	const { recents, loading, error } = useRecentProjects();

	return (
		<Box>
			<Flex
				align='center'
				justify='space-between'
				mb='3.5'
			>
				<Flex
					align='center'
					gap='1.5'
					color='fg.subtle'
					fontSize='10px'
					fontWeight='700'
					letterSpacing='0.08em'
					textTransform='uppercase'
				>
					<History size={11} />
					{'Recent projects'}
				</Flex>
				{embedded && recents.length > 0 && (
					<ChakraButton
						type='button'
						fontSize='10px'
						fontWeight='600'
						color='fg.muted'
						bg='transparent'
						borderWidth='1px'
						borderColor='border.subtle'
						borderRadius='sm'
						px='2'
						py='1'
						cursor='pointer'
						transition='border-color .14s ease, color .14s ease'
						_hover={{ color: 'accent.pink', borderColor: 'accent.pink' }}
						onClick={() => {
							void ipcProjectService.openProject();
						}}
					>
						<Flex align='center' gap='1'>
							<FolderOpen size={10} />
							{'Browse…'}
						</Flex>
					</ChakraButton>
				)}
			</Flex>

			{error && (
				<Box
					p='3'
					fontSize='xs'
					color='accent.alert'
					borderWidth='1px'
					borderColor='border.subtle'
					borderRadius='md'
					bg='bg.surface'
				>
					{`Couldn't load recents: ${error}`}
				</Box>
			)}

			{!error && loading && (
				<RecentsSkeleton />
			)}

			{!error && !loading && recents.length === 0 && (
				<Box
					p='5'
					textAlign='center'
					borderWidth='1px'
					borderStyle='dashed'
					borderColor='border.subtle'
					borderRadius='md'
					bg='bg.surface'
					color='fg.subtle'
					fontSize='sm'
				>
					<Flex direction='column' align='center' gap='1.5'>
						<Clock size={16} />
						<Box>{'No recent projects yet — once you open one, it shows up here.'}</Box>
					</Flex>
				</Box>
			)}

			{!error && !loading && recents.length > 0 && (
				<Flex direction='column' gap='1.5'>
					{recents.slice(0, MAX_VISIBLE).map((r, idx) => (
						<RecentItem key={r.path} idx={idx} recent={r} />
					))}
				</Flex>
			)}
		</Box>
	);
};

interface RecentItemProps {
	idx: number;
	recent: RecentProject;
}

const RecentItem: React.FC<RecentItemProps> = ({ idx, recent }) => (
	<MotionDiv
		initial={{ opacity: 0, x: -6 }}
		animate={{ opacity: 1, x: 0 }}
		transition={{ duration: 0.24, ease: 'easeOut', delay: 0.05 + idx * 0.03 }}
		style={{ display: 'block' }}
	>
		<ChakraButton
			type='button'
			display='block'
			textAlign='left'
			w='100%'
			px='3'
			py='2.5'
			borderRadius='md'
			borderWidth='1px'
			borderColor='border.subtle'
			bg='bg.surface'
			cursor='pointer'
			transition='border-color .12s ease, background-color .12s ease, transform .08s ease'
			_hover={{
				borderColor: 'accent.pink',
				bg: 'color-mix(in srgb, var(--beak-colors-accent-pink) 5%, var(--beak-colors-bg-surface))',
				transform: 'translateY(-1px)',
			}}
			_active={{ transform: 'translateY(0)' }}
			_focusVisible={{
				outline: 'none',
				borderColor: 'accent.pink',
				boxShadow: '0 0 0 2px color-mix(in srgb, var(--beak-colors-accent-pink) 28%, transparent)',
			}}
			onClick={() => {
				void ipcProjectService.openFolder(recent.path);
			}}
		>
			<Flex align='center' gap='2.5'>
				<Flex
					flex='0 0 auto'
					align='center'
					justify='center'
					w='28px'
					h='28px'
					borderRadius='sm'
					bg='color-mix(in srgb, var(--beak-colors-accent-pink) 12%, transparent)'
					borderWidth='1px'
					borderColor='color-mix(in srgb, var(--beak-colors-accent-pink) 24%, transparent)'
					color='accent.pink'
				>
					<FolderGit2 size={13} />
				</Flex>
				<Box flex='1 1 auto' minW={0}>
					<Box
						fontSize='sm'
						fontWeight='600'
						color='fg.default'
						overflow='hidden'
						textOverflow='ellipsis'
						whiteSpace='nowrap'
					>
						{recent.name || basename(recent.path)}
					</Box>
					<Box
						fontSize='10px'
						color='fg.muted'
						fontFamily='mono'
						overflow='hidden'
						textOverflow='ellipsis'
						whiteSpace='nowrap'
					>
						{shortenPath(recent.path)}
					</Box>
				</Box>
				<Box flex='0 0 auto' fontSize='10px' color='fg.subtle' fontWeight='600' letterSpacing='0.02em'>
					{formatRelative(recent.accessTime)}
				</Box>
			</Flex>
		</ChakraButton>
	</MotionDiv>
);

const RecentsSkeleton: React.FC = () => (
	<Flex direction='column' gap='1.5' aria-hidden>
		{[0, 1, 2].map(i => (
			<Box
				key={i}
				h='44px'
				borderRadius='md'
				borderWidth='1px'
				borderColor='border.subtle'
				bg='bg.surface'
				opacity={0.6 - i * 0.15}
				css={{
					backgroundImage:
						'linear-gradient(90deg, transparent 0%, color-mix(in srgb, var(--beak-colors-fg-subtle) 14%, transparent) 50%, transparent 100%)',
					backgroundSize: '200% 100%',
					animation: 'welcomePulse 1.4s ease-in-out infinite',
				}}
			/>
		))}
		<style>{`@keyframes welcomePulse { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }`}</style>
	</Flex>
);

export default RecentsList;
