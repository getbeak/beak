import { Box, Flex, chakra } from '@chakra-ui/react';
import { checkShortcut } from '@beak/ui/lib/keyboard-shortcuts';
import { useAppSelector } from '@beak/ui/store/redux';
import { AnimatePresence, motion } from 'framer-motion';
import { Command, Search, Sparkles } from 'lucide-react';
import * as React from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';

import { useOmniItems } from '../hooks/use-omni-items';
import { useOmniSearch } from '../hooks/use-omni-search';
import { CATEGORY_META } from '../lib/categories';
import type { OmniItem } from '../lib/types';
import { actions } from '../store';
import OmniEmpty from './OmniEmpty';
import OmniFooter from './OmniFooter';
import OmniList from './OmniList';

const ChakraInput = chakra('input');
const MotionBox = motion.create(Box);

const Omnibar: React.FC = () => {
	const dispatch = useDispatch();
	const { open, mode } = useAppSelector(s => s.features.omniBar);
	const [content, setContent] = useState('');
	const [activeIndex, setActiveIndex] = useState(0);
	const inputRef = useRef<HTMLInputElement | null>(null);

	const reset = useCallback(() => {
		setContent('');
		setActiveIndex(0);
		dispatch(actions.hideOmniBar());
	}, [dispatch]);

	useEffect(() => {
		function onKeyDown(event: KeyboardEvent) {
			if (checkShortcut('omni-bar.launch.finder', event)) {
				if (open) {
					reset();
				} else {
					dispatch(actions.showOmniBar({ mode: 'search' }));
					setContent('');
					setActiveIndex(0);
				}
				event.preventDefault();
				return;
			}
			if (checkShortcut('omni-bar.launch.commands', event)) {
				if (open) {
					reset();
				} else {
					dispatch(actions.showOmniBar({ mode: 'commands' }));
					setContent('> ');
					setActiveIndex(0);
				}
				event.preventDefault();
				return;
			}
			if (event.key === 'Escape' && open) {
				reset();
				event.preventDefault();
			}
		}
		window.addEventListener('keydown', onKeyDown);
		return () => window.removeEventListener('keydown', onKeyDown);
	}, [dispatch, open, reset]);

	useEffect(() => {
		if (open && mode === 'commands' && !content.startsWith('>')) setContent('> ');
		if (open) setTimeout(() => inputRef.current?.focus(), 16);
	}, [open, mode]); // eslint-disable-line react-hooks/exhaustive-deps

	const allItems = useOmniItems();
	const { groups, flatItems, scope } = useOmniSearch(allItems, content);

	useEffect(() => {
		setActiveIndex(prev => {
			if (flatItems.length === 0) return 0;
			if (prev >= flatItems.length) return 0;
			return prev;
		});
	}, [flatItems.length]);

	const activeItem: OmniItem | undefined = flatItems[activeIndex];

	const selectActive = useCallback(() => {
		if (!activeItem) return;
		reset();
		activeItem.action({ dispatch });
	}, [activeItem, dispatch, reset]);

	const accent = useMemo(() => {
		if (scope === 'commands') return 'var(--beak-colors-accent-success)';
		if (scope === 'recents') return 'var(--beak-colors-accent-indigo)';
		return activeItem ? CATEGORY_META[activeItem.category].accent : 'var(--beak-colors-accent-pink)';
	}, [scope, activeItem]);

	const ModeIcon = scope === 'commands' ? Command : scope === 'recents' ? Sparkles : Search;
	const placeholder =
		scope === 'commands'
			? 'Run a command…'
			: scope === 'recents'
				? 'Browse recent items…'
				: 'Find requests, folders, var sets, pages, commands…';

	const trimmedContent = content.trim();
	const hasQuery = trimmedContent.length > 0 && trimmedContent !== '>' && trimmedContent !== '~';

	return (
		<AnimatePresence>
			{open && (
				<MotionBox
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					exit={{ opacity: 0 }}
					transition={{ duration: 0.12, ease: 'easeOut' }}
					position='absolute'
					inset='0'
					zIndex={100}
					display='flex'
					alignItems='flex-start'
					justifyContent='center'
					px='4'
					pt='14'
					pb='6'
					css={{
						// Single backdrop layer — the previous double-blur (backdrop
						// + panel both running `backdrop-filter`) caused a visible
						// multi-frame paint cascade on Electron because Chromium has
						// to re-rasterise every layer on each animation tick.
						background: 'rgba(0, 0, 0, 0.45)',
						backdropFilter: 'blur(14px) saturate(130%)',
					}}
					onClick={() => reset()}
				>
					<MotionBox
						role='dialog'
						aria-modal='true'
						aria-label='Command bar'
						initial={{ opacity: 0, y: -8 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0, y: -6 }}
						transition={{ duration: 0.14, ease: [0.16, 1, 0.3, 1] }}
						position='relative'
						w='640px'
						maxW='calc(100vw - 40px)'
						borderRadius='xl'
						borderWidth='1px'
						bg='bg.surface'
						display='flex'
						flexDirection='column'
						zIndex={101}
						overflow='hidden'
						onClick={(event: React.MouseEvent) => event.stopPropagation()}
						style={{
							// `style` (not `css`) so the accent-driven values write
							// straight to inline styles — no className/utility-class
							// className churn when the accent changes scope.
							borderColor: `color-mix(in srgb, ${accent} 30%, var(--beak-colors-border-default))`,
							boxShadow: [
								'0 40px 110px rgba(0,0,0,0.42)',
								'0 0 0 1px color-mix(in srgb, white 5%, transparent)',
								'inset 0 1px 0 color-mix(in srgb, white 16%, transparent)',
							].join(', '),
						}}
						css={{ maxHeight: 'min(560px, calc(100vh - 120px))' }}
					>
						<Flex
							align='center'
							px='3'
							h='48px'
							gap='2.5'
							flex='0 0 auto'
							position='relative'
							zIndex={3}
							css={{
								background: `radial-gradient(120% 200% at 0% 0%, color-mix(in srgb, ${accent} 14%, transparent), transparent 60%)`,
							}}
						>
							<motion.div
								key={ModeIcon === Command ? 'cmd' : ModeIcon === Sparkles ? 'rec' : 'search'}
								initial={{ opacity: 0, scale: 0.85 }}
								animate={{ opacity: 1, scale: 1 }}
								transition={{ duration: 0.12, ease: 'easeOut' }}
								style={{ display: 'flex', alignItems: 'center', color: accent }}
							>
								<ModeIcon size={16} />
							</motion.div>
							<ChakraInput
								ref={inputRef}
								placeholder={placeholder}
								value={content}
								onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
									setContent(e.currentTarget.value);
									setActiveIndex(0);
								}}
								onKeyDown={(event: React.KeyboardEvent<HTMLInputElement>) => {
									switch (event.key) {
										case 'ArrowDown':
											event.preventDefault();
											setActiveIndex(idx => (flatItems.length === 0 ? 0 : (idx + 1) % flatItems.length));
											break;
										case 'ArrowUp':
											event.preventDefault();
											setActiveIndex(idx =>
												flatItems.length === 0 ? 0 : (idx - 1 + flatItems.length) % flatItems.length,
											);
											break;
										case 'Home':
											if (flatItems.length > 0) {
												event.preventDefault();
												setActiveIndex(0);
											}
											break;
										case 'End':
											if (flatItems.length > 0) {
												event.preventDefault();
												setActiveIndex(flatItems.length - 1);
											}
											break;
										case 'PageDown':
											if (flatItems.length > 0) {
												event.preventDefault();
												setActiveIndex(idx => Math.min(idx + 6, flatItems.length - 1));
											}
											break;
										case 'PageUp':
											if (flatItems.length > 0) {
												event.preventDefault();
												setActiveIndex(idx => Math.max(idx - 6, 0));
											}
											break;
										case 'Enter':
											event.preventDefault();
											selectActive();
											break;
										default:
											break;
									}
								}}
								border='none'
								outline='none'
								bg='transparent'
								color='fg.default'
								fontSize='15px'
								lineHeight='48px'
								h='48px'
								flex='1 1 auto'
								minW={0}
								_placeholder={{ color: 'fg.subtle' }}
								css={{ caretColor: accent }}
							/>
							<Box
								fontSize='10px'
								fontWeight='700'
								letterSpacing='0.08em'
								textTransform='uppercase'
								px='1.5'
								py='0.5'
								borderRadius='sm'
								css={{
									background: `color-mix(in srgb, ${accent} 14%, transparent)`,
									color: accent,
									border: `1px solid color-mix(in srgb, ${accent} 30%, transparent)`,
									boxShadow: 'inset 0 1px 0 color-mix(in srgb, white 14%, transparent)',
								}}
							>
								{scope === 'commands' ? 'Cmd' : scope === 'recents' ? 'Recent' : 'Find'}
							</Box>
						</Flex>

						<Box
							flex='1 1 auto'
							minH='0'
							display='flex'
							flexDirection='column'
							borderTopWidth='1px'
							borderColor='border.subtle'
							position='relative'
							zIndex={2}
						>
							{flatItems.length === 0 ? (
								<OmniEmpty hasQuery={hasQuery} scope={scope} />
							) : (
								<OmniList
									groups={groups}
									flatItems={flatItems}
									activeIndex={activeIndex}
									onSelect={item => {
										reset();
										item.action({ dispatch });
									}}
									onHoverIndex={setActiveIndex}
								/>
							)}
						</Box>

						<Box flex='0 0 auto' position='relative' zIndex={3}>
							<OmniFooter scope={scope} activeCategory={activeItem?.category} resultCount={flatItems.length} />
						</Box>
					</MotionBox>
				</MotionBox>
			)}
		</AnimatePresence>
	);
};

export default Omnibar;
