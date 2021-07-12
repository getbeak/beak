import { toVibrancyAlpha } from '@beak/app/design-system/utils';
import { checkShortcut } from '@beak/app/lib/keyboard-shortcuts';
import React, { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';

import { actions } from '../store';
import FinderView from './organism/FinderView';

const Omnibar: React.FunctionComponent = () => {
	const { open, mode } = useSelector(s => s.features.omniBar);
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
				if (open)
					dispatch(actions.hideOmniBar());
				else
					dispatch(actions.showOmniBar({ mode: 'search' }));

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

	function getPlaceholder() {
		if (mode === 'search')
			return 'Search requests by name, host, or path';

		return 'command selector isn\'t ready yet xoxo';
	}

	if (!open)
		return null;

	return (
		<Container onClick={() => dispatch(actions.hideOmniBar())}>
			<BarOuter onClick={event => void event.stopPropagation()}>
				<Bar>
					<BarInput
						placeholder={getPlaceholder()}
						tabIndex={0}
						ref={i => {
							inputRef.current = i;
						}}
						value={content}
						onChange={e => setContent(e.currentTarget.value)}
					/>
					{mode === 'search' && <FinderView content={content} reset={reset} />}
					{mode === 'commands' && <span>{'todo'}</span>}
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
	box-shadow: 0px 8px 12px 2px ${p => toVibrancyAlpha(p.theme.ui.surfaceFill, 1)};

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

export default Omnibar;
