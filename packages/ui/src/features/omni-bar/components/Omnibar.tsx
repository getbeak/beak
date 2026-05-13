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
						background:
							'color-mix(in srgb, var(--beak-colors-bg-canvas) 55%, transparent)',
						backdropFilter: 'blur(2px)',
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
						w='540px'
						maxW='calc(100vw - 40px)'
						borderRadius='xl'
						borderWidth='1px'
						borderColor='border.default'
						bg='color-mix(in srgb, var(--beak-colors-bg-surface) 80%, transparent)'
						boxShadow='0 24px 64px rgba(0,0,0,0.35), 0 2px 8px rgba(0,0,0,0.25)'
						css={{ backdropFilter: 'blur(24px) saturate(160%)' }}
						overflow='hidden'
						zIndex={101}
						onClick={(event: React.MouseEvent) => event.stopPropagation()}
					>
						<Flex align='center' px='3' h='44px' gap='2'>
							<Box color={isCommands ? 'accent.teal' : 'accent.pink'}>
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
							<Box fontSize='10px' color='fg.subtle' opacity={0.65}>
								{isCommands ? 'Cmd mode' : 'Find mode'}
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
										background: 'color-mix(in srgb, var(--beak-colors-fg-muted) 25%, transparent)',
										borderRadius: '3px',
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
