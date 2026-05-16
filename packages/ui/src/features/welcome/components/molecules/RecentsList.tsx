import type { RecentProject, RecentProjectSource } from '@beak/common/types/beak-hub';
import { Box, Flex, Input, chakra } from '@chakra-ui/react';
import { motion } from 'framer-motion';
import { Clock, Cloud, FolderGit2, FolderOpen, HardDrive, History, Pencil } from 'lucide-react';
import * as React from 'react';
import { useState } from 'react';

import { ipcProjectService } from '../../../../lib/ipc';
import { useRecentProjects } from '../../hooks/use-recent-projects';
import { basename, formatRelative, shortenPath } from '../../lib/format-relative';

const MAX_VISIBLE = 5;

const ChakraButton = chakra('button');
const MotionDiv = motion.div;

interface RecentsListProps {
	embedded: boolean;
}

const RecentsList: React.FC<RecentsListProps> = ({ embedded }) => {
	const { recents, loading, error, reload } = useRecentProjects();

	return (
		<Box>
			<Flex
				align='center'
				justify='space-between'
				mb='2.5'
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
						<RecentItem key={r.path} idx={idx} recent={r} embedded={embedded} onRenamed={reload} />
					))}
				</Flex>
			)}
		</Box>
	);
};

interface RecentItemProps {
	idx: number;
	recent: RecentProject;
	embedded: boolean;
	onRenamed: () => Promise<void> | void;
}

const RecentItem: React.FC<RecentItemProps> = ({ idx, recent, embedded, onRenamed }) => {
	const fallbackName = recent.name || basename(recent.path);
	const [renaming, setRenaming] = useState(false);
	const [draft, setDraft] = useState(fallbackName);
	const [busy, setBusy] = useState(false);

	function startRename() {
		setDraft(fallbackName);
		setRenaming(true);
	}

	async function commit() {
		const next = draft.trim();
		if (!next || next === fallbackName) {
			setRenaming(false);
			return;
		}
		setBusy(true);
		try {
			const ok = await ipcProjectService.renameProjectAtPath({ projectPath: recent.path, name: next });
			if (ok) await onRenamed();
		} catch (err) {
			console.warn('rename project failed', err);
		} finally {
			setBusy(false);
			setRenaming(false);
		}
	}

	function cancel() {
		setDraft(fallbackName);
		setRenaming(false);
	}

	const sharedRowStyle = {
		display: 'block',
		textAlign: 'left' as const,
		w: '100%',
		px: '3',
		py: '2',
		borderRadius: 'md',
		borderWidth: '1px',
		borderColor: renaming ? 'accent.pink' : 'border.subtle',
		bg: renaming
			? 'color-mix(in srgb, var(--beak-colors-accent-pink) 4%, var(--beak-colors-bg-surface))'
			: 'bg.surface',
	};

	const body = (
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
				{renaming ? (
					<Input
						autoFocus
						size='xs'
						h='22px'
						px='1.5'
						fontSize='sm'
						fontWeight='600'
						borderRadius='sm'
						borderWidth='1px'
						borderColor='accent.pink'
						bg='bg.surface'
						value={draft}
						disabled={busy}
						onClick={event => event.stopPropagation()}
						onKeyDown={event => {
							event.stopPropagation();
							if (event.key === 'Enter') {
								event.preventDefault();
								void commit();
							} else if (event.key === 'Escape') {
								event.preventDefault();
								cancel();
							}
						}}
						onChange={event => setDraft(event.target.value)}
						onBlur={() => void commit()}
					/>
				) : (
					<Box
						fontSize='sm'
						fontWeight='600'
						color='fg.default'
						overflow='hidden'
						textOverflow='ellipsis'
						whiteSpace='nowrap'
					>
						{fallbackName}
					</Box>
				)}
				<SourceSubtitle recent={recent} embedded={embedded} />
			</Box>
			{!renaming && (
				<ChakraButton
					type='button'
					aria-label={`Rename ${fallbackName}`}
					title='Rename'
					data-recent-rename
					display='inline-flex'
					alignItems='center'
					justifyContent='center'
					flex='0 0 auto'
					w='22px'
					h='22px'
					borderRadius='sm'
					bg='transparent'
					border='none'
					color='fg.subtle'
					cursor='pointer'
					opacity={0}
					transition='opacity .12s ease, color .12s ease, background-color .12s ease'
					_hover={{
						color: 'accent.pink',
						bg: 'color-mix(in srgb, var(--beak-colors-accent-pink) 10%, transparent)',
					}}
					_focusVisible={{
						opacity: 1,
						outline: 'none',
						color: 'accent.pink',
						boxShadow: '0 0 0 1px var(--beak-colors-accent-pink)',
					}}
					onClick={event => {
						event.preventDefault();
						event.stopPropagation();
						startRename();
					}}
				>
					<Pencil size={11} strokeWidth={2} />
				</ChakraButton>
			)}
			<Box flex='0 0 auto' fontSize='10px' color='fg.subtle' fontWeight='600' letterSpacing='0.02em'>
				{formatRelative(recent.accessTime)}
			</Box>
		</Flex>
	);

	return (
		<MotionDiv
			initial={{ opacity: 0, x: -6 }}
			animate={{ opacity: 1, x: 0 }}
			transition={{ duration: 0.24, ease: 'easeOut', delay: 0.05 + idx * 0.03 }}
			style={{ display: 'block' }}
		>
			{renaming ? (
				<Box {...sharedRowStyle}>{body}</Box>
			) : (
				<ChakraButton
					type='button'
					{...sharedRowStyle}
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
					css={{
						'&:hover [data-recent-rename], &:focus-within [data-recent-rename]': { opacity: 1 },
					}}
					onClick={() => {
						void ipcProjectService.openFolder(recent.path);
					}}
				>
					{body}
				</ChakraButton>
			)}
		</MotionDiv>
	);
};

interface SourceSubtitleProps {
	recent: RecentProject;
	embedded: boolean;
}

/**
 * Sub-line under each recent: a real fs path for desktop projects, a
 * sandbox badge for browser-resident projects, and a "local folder · name"
 * label for FSA-mounted ones. The renderer doesn't know an absolute OS
 * path in any web mode — FSA doesn't expose one — so paths are deliberately
 * scoped to the source kind, never to a raw `/<projectId>` string that's
 * meaningless out of context.
 */
const SourceSubtitle: React.FC<SourceSubtitleProps> = ({ recent, embedded }) => {
	const source: RecentProjectSource = recent.source ?? (embedded ? 'desktop' : 'browser');

	if (source === 'desktop') {
		return (
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
		);
	}

	if (source === 'local-folder') {
		return (
			<Flex align='center' gap='1' mt='0.5' fontSize='10px' color='fg.muted'>
				<HardDrive size={10} strokeWidth={2} />
				<Box>{'Local folder'}</Box>
			</Flex>
		);
	}

	return (
		<Flex align='center' gap='1' mt='0.5' fontSize='10px' color='fg.muted'>
			<Cloud size={10} strokeWidth={2} />
			<Box>{'In browser storage'}</Box>
		</Flex>
	);
};

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
