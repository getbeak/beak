import React, { useEffect, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import { toVibrancyAlpha } from '@beak/app/design-system/utils';
import { checkShortcut } from '@beak/app/lib/keyboard-shortcuts';
import { useAppSelector } from '@beak/app/store/redux';
import styled from 'styled-components';

import { actions } from '../store';
import CommandsView from './organism/CommandsView';
import FinderView from './organism/FinderView';

const Omnibar: React.FC<React.PropsWithChildren<unknown>> = () => {
	const { open } = useAppSelector(s => s.features.omniBar);
	const [content, setContent] = useState('');
	const inputRef = useRef<HTMLInputElement | null>(null);
	const dispatch = useDispatch();

	useEffect(() => {
		window.addEventListener('keydown', onKeyDown);

		return () => {
			window.removeEventListener('keydown', onKeyDown);
		};
	}, []);

	useEffect(() => {
		if (open)
			inputRef?.current?.focus();
	}, [open, inputRef]);

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
	position: absolute;
	top: 0; bottom: 0; left: 0; right: 0;
`;

const BarOuter = styled.div`
	backdrop-filter: blur(25px);
	background: ${p => toVibrancyAlpha(p.theme.ui.surfaceHighlight, 0.4)};
	border: 1px solid ${p => p.theme.ui.blankBackground};
	box-shadow: 0px 4px 12px 2px ${p => toVibrancyAlpha(p.theme.ui.surfaceFill, 0.6)};

	position: relative;
	margin: 0 auto;
	margin-top: 120px;
	width: 450px;
	border-radius: 10px;

	z-index: 101;
`;

const Bar = styled.div`
	border: 1px solid ${p => p.theme.ui.backgroundBorderSeparator};
	border-radius: 10px;
`;

const BarInput = styled.input`
	border: none;
	background: none;
	color: ${p => p.theme.ui.textOnSurfaceBackground};

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
	border-top: 1px solid ${p => p.theme.ui.backgroundBorderSeparator};
	overflow-x: hidden;
	overflow-y: overlay;
`;

export default Omnibar;
