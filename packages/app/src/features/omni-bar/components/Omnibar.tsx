import { toVibrancyAlpha } from '@beak/app/design-system/utils';
import { checkShortcut } from '@beak/app/lib/keyboard-shortcuts';
import React, { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';

import FinderView from './organism/FinderView';

type Mode = 'finder' | 'commands';

const Omnibar: React.FunctionComponent = () => {
	const [show, setShow] = useState(false);
	const [mode, setMode] = useState<Mode>('finder');
	const [content, setContent] = useState('');
	const inputRef = useRef<HTMLInputElement | null>(null);

	useEffect(() => {
		window.addEventListener('keydown', onKeyDown);

		return () => {
			window.removeEventListener('keydown', onKeyDown);
		};
	}, []);

	useEffect(() => {
		if (show)
			inputRef?.current?.focus();
	}, [show, inputRef]);

	function onKeyDown(event: KeyboardEvent) {
		switch (true) {
			case checkShortcut('omni-bar.launch.finder', event):
				if (show) {
					setShow(false);
				} else {
					setShow(true);
					setMode('finder');
				}

				return;

			case event.key === 'Escape':
				reset();

				return;

			default:
				return;
		}
	}

	function reset() {
		setContent('');
		setShow(false);
	}

	function getPlaceholder() {
		if (mode === 'finder')
			return 'Search requests by name, host, or path';

		return 'commands n tings, todo';
	}

	if (!show)
		return null;

	return (
		<Container>
			<BarOuter>
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
					{mode === 'finder' && <FinderView content={content} reset={reset} />}
					{mode === 'commands' && <span>{'todo'}</span>}
				</Bar>
			</BarOuter>
		</Container>
	);
};

const Container = styled.div`
	position: absolute;
	top: 120px; bottom: 0; left: 0; right: 0;
`;

const BarOuter = styled.div`
	background: ${p => p.theme.ui.surfaceHighlight};
	border: 1px solid ${p => p.theme.ui.blankBackground};
	box-shadow: 0px 8px 12px 2px ${p => toVibrancyAlpha(p.theme.ui.surfaceFill, 1)};

	position: relative;
	margin: 0 auto;
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
