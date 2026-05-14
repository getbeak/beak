import { Box, Flex, chakra } from '@chakra-ui/react';
import { checkShortcut } from '@beak/ui/lib/keyboard-shortcuts';
import { useAppSelector } from '@beak/ui/store/redux';
import { AnimatePresence, motion } from 'framer-motion';
import { Search, Terminal } from 'lucide-react';
import * as React from 'react';
import { useEffect, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';

import { actions } from '../store';
import OmniFooter from './atoms/OmniFooter';
import CommandsView from './organism/CommandsView';
import FinderView from './organism/FinderView';

const ChakraInput = chakra('input');
const MotionBox = motion.create(Box);

const Omnibar: React.FC = () => {
	const { open, mode } = useAppSelector(s => s.features.omniBar);
	const [content, setContent] = useState('');
	const inputRef = useRef<HTMLInputElement | null>(null);
	const dispatch = useDispatch();

	useEffect(() => {
		window.addEventListener('keydown', onKeyDown);
		return () => window.removeEventListener('keydown', onKeyDown);
	}, []);

	useEffect(() => {
		if (open) inputRef?.current?.focus();
	}, [open, inputRef]);

	useEffect(() => {
		if (open && mode === 'commands') setContent('>');
	}, [open, mode]);

	function onKeyDown(event: KeyboardEvent) {
		switch (true) {
			case checkShortcut('omni-bar.launch.finder', event):
				if (open) {
					dispatch(actions.hideOmniBar());
				} else {
					dispatch(actions.showOmniBar({ mode: 'search' }));
					setContent('');
				}
				break;
			case checkShortcut('omni-bar.launch.commands', event):
				if (open) {
					dispatch(actions.hideOmniBar());
				} else {
					dispatch(actions.showOmniBar({ mode: 'search' }));
					setContent('>');
				}
				break;
			case event.key === 'Escape':
				reset();
				break;
			default:
				return;
		}
		event.preventDefault();
	}

	function reset() {
		setContent('');
		dispatch(actions.hideOmniBar());
	}

	const isCommands = content.startsWith('>');
	const ModeIcon = isCommands ? Terminal : Search;
	const placeholder = isCommands
		? 'Run a command…'
		: 'Search requests by name, host, or path';

	return (
		<AnimatePresence>
			{open && (
				<MotionBox
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					exit={{ opacity: 0 }}
					transition={{ duration: 0.14, ease: 'easeOut' }}
					position='absolute'
					inset='0'
					zIndex={100}
					css={{
						background: 'color-mix(in srgb, var(--beak-colors-gray-950) 42%, transparent)',
						backdropFilter: 'blur(16px) saturate(160%)',
					}}
					onClick={() => dispatch(actions.hideOmniBar())}
				>
					<MotionBox
						initial={{ opacity: 0, y: -8, scale: 0.98 }}
						animate={{ opacity: 1, y: 0, scale: 1 }}
						exit={{ opacity: 0, y: -8, scale: 0.98 }}
						transition={{ type: 'spring', stiffness: 600, damping: 30 }}
						position='relative'
						mx='auto'
						mt='20'
						w='600px'
						maxW='calc(100vw - 40px)'
						borderRadius='xl'
						borderWidth='1px'
						borderColor='color-mix(in srgb, var(--beak-colors-accent-pink) 28%, var(--beak-colors-border-subtle))'
						bg='color-mix(in srgb, var(--beak-colors-bg-surface) 70%, transparent)'
						backdropFilter='blur(28px) saturate(180%)'
						boxShadow='0 50px 120px rgba(0,0,0,0.42), 0 20px 56px color-mix(in srgb, var(--beak-colors-accent-pink) 22%, rgba(0,0,0,0.2)), 0 0 0 1px color-mix(in srgb, white 6%, transparent), inset 0 1px 0 color-mix(in srgb, white 22%, transparent)'
						overflow='hidden'
						zIndex={101}
						onClick={(event: React.MouseEvent) => event.stopPropagation()}
						css={{
							'&::before': {
								content: '""',
								position: 'absolute',
								top: 0,
								left: 0,
								right: 0,
								height: '120px',
								background: 'radial-gradient(60% 100% at 20% 0%, color-mix(in srgb, var(--beak-colors-accent-pink) 28%, transparent), transparent 65%), radial-gradient(70% 110% at 85% 0%, color-mix(in srgb, var(--beak-colors-accent-teal) 18%, transparent), transparent 70%)',
								pointerEvents: 'none',
								zIndex: 0,
							},
							'&::after': {
								content: '""',
								position: 'absolute',
								top: 0,
								left: '6%',
								right: '6%',
								height: '1px',
								background: 'linear-gradient(90deg, transparent, color-mix(in srgb, var(--beak-colors-accent-pink) 80%, transparent) 30%, color-mix(in srgb, var(--beak-colors-accent-teal) 70%, transparent) 70%, transparent)',
								pointerEvents: 'none',
								zIndex: 1,
							},
							'& > *': { position: 'relative', zIndex: 2 },
						}}
					>
						<Flex align='center' px='3' h='44px' gap='2'>
							<Box
								color={isCommands ? 'accent.teal' : 'accent.pink'}
								filter={`drop-shadow(0 0 4px color-mix(in srgb, var(--beak-colors-${isCommands ? 'accent-teal' : 'accent-pink'}) 45%, transparent))`}
							>
								<ModeIcon size={16} />
							</Box>
							<ChakraInput
								placeholder={placeholder}
								tabIndex={0}
								ref={inputRef}
								value={content}
								onChange={e => setContent(e.currentTarget.value)}
								border='none'
								outline='none'
								bg='transparent'
								color='fg.default'
								fontSize='15px'
								lineHeight='44px'
								h='44px'
								flex='1 1 auto'
								minW={0}
								_placeholder={{ color: 'fg.subtle' }}
								css={{ caretColor: 'var(--beak-colors-accent-pink)' }}
							/>
							<Box
								fontSize='10px'
								fontWeight='700'
								letterSpacing='0.06em'
								textTransform='uppercase'
								px='1.5'
								py='0.5'
								borderRadius='sm'
								borderWidth='1px'
								borderStyle='solid'
								color={isCommands ? 'accent.teal' : 'accent.pink'}
								bg={`color-mix(in srgb, var(--beak-colors-${isCommands ? 'accent-teal' : 'accent-pink'}) 14%, transparent)`}
								borderColor={`color-mix(in srgb, var(--beak-colors-${isCommands ? 'accent-teal' : 'accent-pink'}) 28%, transparent)`}
								boxShadow='inset 0 1px 0 color-mix(in srgb, white 14%, transparent)'
							>
								{isCommands ? 'Cmd' : 'Find'}
							</Box>
						</Flex>

						{content && (
							<Box
								maxH='min(calc(100vh - 200px), 420px)'
								borderTopWidth='1px'
								borderColor='border.subtle'
								overflowX='hidden'
								overflowY='auto'
								css={{
									'&::-webkit-scrollbar': { width: '6px' },
									'&::-webkit-scrollbar-thumb': {
										background: 'color-mix(in srgb, var(--beak-colors-fg-muted) 22%, transparent)',
										borderRadius: '3px',
									},
									'&::-webkit-scrollbar-thumb:hover': {
										background: 'color-mix(in srgb, var(--beak-colors-accent-pink) 55%, transparent)',
									},
								}}
							>
								{!isCommands && <FinderView content={content} reset={reset} />}
								{isCommands && <CommandsView content={content} reset={reset} />}
							</Box>
						)}

						<OmniFooter mode={isCommands ? 'commands' : 'finder'} />
					</MotionBox>
				</MotionBox>
			)}
		</AnimatePresence>
	);
};

export default Omnibar;
