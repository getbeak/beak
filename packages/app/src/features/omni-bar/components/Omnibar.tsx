import React, { useEffect, useRef, useState } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import styled from 'styled-components';

import FinderView from './organism/FinderView';

type Mode = 'finder' | 'commands';

const Omnibar: React.FunctionComponent = () => {
	const [show, setShow] = useState(false);
	const [mode, setMode] = useState<Mode>('finder');
	const [content, setContent] = useState('');
	const inputRef = useRef<HTMLInputElement | null>(null);

	useHotkeys('cmd+p', () => {
		setShow(!show);
		setMode('finder');
	}, { enableOnTags: ['INPUT', 'TEXTAREA', 'SELECT'] }, [show, mode]);

	useHotkeys('cmd+shift+p,cmd+k', () => {
		setShow(!show);
		setMode('commands');
	}, { enableOnTags: ['INPUT', 'TEXTAREA', 'SELECT'] }, [show, mode]);

	useHotkeys('escape', () => {
		if (show)
			setShow(false);
	}, { enableOnTags: ['INPUT', 'TEXTAREA', 'SELECT'] }, [show, mode]);

	useEffect(() => {
		if (show)
			inputRef?.current?.focus();
	}, [show, inputRef]);

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
