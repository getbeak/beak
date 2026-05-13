import React from 'react';
import { useEffect, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import { fadeIn, scaleIn } from '@beak/design-system/animations';
import { checkShortcut } from '@beak/ui/lib/keyboard-shortcuts';
import { useAppSelector } from '@beak/ui/store/redux';
import styled from 'styled-components';

import { actions } from '../store';
import CommandsView from './organism/CommandsView';
import FinderView from './organism/FinderView';

const Omnibar: React.FC<React.PropsWithChildren<unknown>> = () => {
	const { open, mode } = useAppSelector(s => s.features.omniBar);
	const [content, setContent] = useState('');
	const inputRef = useRef<HTMLInputElement | null>(null);
	const dispatch = useDispatch();

	useEffect(() => {
		window.addEventListener('keydown', onKeyDown);

		return () => window.removeEventListener('keydown', onKeyDown);
	}, []);

	useEffect(() => {
		if (open)
			inputRef?.current?.focus();
	}, [open, inputRef]);

	useEffect(() => {
		if (open && mode === 'commands')
			setContent('>');
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

	if (!open)
		return null;

	return (
		<Container onClick={() => dispatch(actions.hideOmniBar())}>
			<BarOuter onClick={event => void event.stopPropagation()}>
				<Bar>
					<BarInput
						placeholder={'Search requests by name, host, or path'}
						tabIndex={0}
						ref={i => {
							inputRef.current = i;
						}}
						value={content}
						onChange={e => setContent(e.currentTarget.value)}
					/>
					{content && (
						<BarContent>
							{!content.startsWith('>') && <FinderView content={content} reset={reset} />}
							{content.startsWith('>') && <CommandsView content={content} reset={reset} />}
						</BarContent>
					)}
				</Bar>
			</BarOuter>
		</Container>
	);
};

const Container = styled.div`
	background: color-mix(in srgb, var(--beak-colors-bg-surface-alt) 60%, transparent);
	position: absolute;
	top: 0; bottom: 0; left: 0; right: 0;
	z-index: 100;

	animation: ${fadeIn} .2s ease;
`;

const BarOuter = styled.div`
	backdrop-filter: blur(100px);
	background: color-mix(in srgb, var(--beak-colors-bg-surface-alt) 40%, transparent);
	border: 1px solid var(--beak-colors-bg-canvas);
	box-shadow: 0px 4px 12px 2px color-mix(in srgb, var(--beak-colors-bg-surface) 60%, transparent);

	position: relative;
	margin: 0 auto;
	margin-top: 120px;
	width: 450px;
	border-radius: 10px;

	transform-origin: center;
	animation: ${scaleIn} .2s ease;
	transition: transform .1s ease;

	z-index: 101;
`;

const Bar = styled.div`
	border: 1px solid var(--beak-colors-border-default);
	border-radius: 10px;
`;

const BarInput = styled.input`
	border: none;
	background: none;
	color: var(--beak-colors-fg-default);

	font-weight: 300;
	font-size: 20px;
	line-height: 40px;
	padding: 0 10px;
	height: 40px;
	width: calc(100% - 20px);

	&:focus {
		outline: none;
	}
`;

const BarContent = styled.div`
	max-height: min(calc(100vh - 160px - 40px), 400px);
	border-top: 1px solid var(--beak-colors-border-default);
	overflow-x: hidden;
	overflow-y: overlay;
`;

export default Omnibar;
