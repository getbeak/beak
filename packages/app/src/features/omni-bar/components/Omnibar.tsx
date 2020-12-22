import { isDarwin } from '@beak/app/globals';
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

		return function remove() {
			window.removeEventListener('keydown', onKeyDown);
		};
	}, []);

	useEffect(() => {
		if (show)
			inputRef?.current?.focus();
	}, [show, inputRef]);

	function onKeyDown(event: KeyboardEvent) {
		if (!['p', 'k', 'Escape'].includes(event.key))
			return;

		if (event.key === 'Escape') {
			reset();

			return;
		}

		const isAct = (isDarwin() && event.metaKey) || (!isDarwin() && event.ctrlKey);
		const isFinder = event.key === 'p' && isAct;
		const isCommands = event.key === 'k' && event.shiftKey && isAct;

		if (isCommands)
			setMode('commands');
		else if (isFinder)
			setMode('finder');

		setShow(!show);
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
		</Container>
	);
};

const Container = styled.div`
	position: absolute;
	top: 120px; bottom: 0; left: 0; right: 0;
`;

const Bar = styled.div`
	position: relative;
	margin: 0 auto;
	width: 450px;

	border-radius: 10px;
	background: ${p => p.theme.ui.backgroundBorderSeparator};
	border: 1px solid ${p => p.theme.ui.primaryFill};

	z-index: 101;
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
