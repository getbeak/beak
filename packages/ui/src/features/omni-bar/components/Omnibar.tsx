import { Box } from '@chakra-ui/react';
import { checkShortcut } from '@beak/ui/lib/keyboard-shortcuts';
import { useAppSelector } from '@beak/ui/store/redux';
import * as React from 'react';
import { useEffect, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';

import { actions } from '../store';
import CommandsView from './organism/CommandsView';
import FinderView from './organism/FinderView';

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

	if (!open) return null;

	return (
		<Box
			position='absolute'
			inset='0'
			zIndex={100}
			bg='color-mix(in srgb, var(--beak-colors-bg-surface-alt) 60%, transparent)'
			animation='beakOmniFade .2s ease'
			css={{
				'@keyframes beakOmniFade': { '0%': { opacity: 0 }, '100%': { opacity: 1 } },
				'@keyframes beakOmniScale': {
					'0%': { transform: 'scale(.97)', opacity: 0 },
					'100%': { transform: 'scale(1)', opacity: 1 },
				},
			}}
			onClick={() => dispatch(actions.hideOmniBar())}
		>
			<Box
				position='relative'
				mx='auto'
				mt='30'
				w='450px'
				borderRadius='lg'
				backdropFilter='blur(100px)'
				bg='color-mix(in srgb, var(--beak-colors-bg-surface-alt) 40%, transparent)'
				borderWidth='1px'
				borderColor='bg.canvas'
				boxShadow='0px 4px 12px 2px color-mix(in srgb, var(--beak-colors-bg-surface) 60%, transparent)'
				transformOrigin='center'
				animation='beakOmniScale .2s ease'
				transition='transform .1s ease'
				zIndex={101}
				onClick={(event: React.MouseEvent) => event.stopPropagation()}
			>
				<Box borderWidth='1px' borderColor='border.default' borderRadius='lg'>
					<input
						placeholder='Search requests by name, host, or path'
						tabIndex={0}
						ref={inputRef}
						value={content}
						onChange={e => setContent(e.currentTarget.value)}
						style={{
							border: 'none',
							background: 'none',
							color: 'var(--beak-colors-fg-default)',
							fontWeight: 300,
							fontSize: '20px',
							lineHeight: '40px',
							padding: '0 10px',
							height: '40px',
							width: 'calc(100% - 20px)',
							outline: 'none',
						}}
					/>
					{content && (
						<Box
							maxH='min(calc(100vh - 160px - 40px), 400px)'
							borderTopWidth='1px'
							borderColor='border.default'
							overflowX='hidden'
							overflowY='auto'
						>
							{!content.startsWith('>') && <FinderView content={content} reset={reset} />}
							{content.startsWith('>') && <CommandsView content={content} reset={reset} />}
						</Box>
					)}
				</Box>
			</Box>
		</Box>
	);
};

export default Omnibar;
