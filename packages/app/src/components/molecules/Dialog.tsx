import ksuid from '@cuvva/ksuid';
import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import styled from 'styled-components';

const dialogContainerId = 'generic-dialog-container';
let dialogStack = 0;

interface DialogProps {
	onClose: () => void;
}

const Dialog: React.FunctionComponent<DialogProps> = props => {
	const { children, onClose } = props;
	const [identifier, setIdentifer] = useState<string>();
	const stackIndex = useRef(dialogStack + 1);

	useEffect(() => {
		const ident = ksuid.generate('dialog').toString();
		const container = document.getElementById(dialogContainerId);
		const element = document.createElement('div');

		element.setAttribute('id', ident);
		container!.appendChild(element);
		setIdentifer(ident);

		dialogStack++;

		return () => {
			const container = document.getElementById(dialogContainerId);
			const element = document.getElementById(identifier!);

			container!.removeChild(element!);

			dialogStack--;
		};
	}, []);

	if (!identifier)
		return null;

	return createPortal(
		<Container
			backdrop={stackIndex.current === 1}
			onClick={() => onClose()}
		>
			<Wrapper onClick={e => e.stopPropagation()}>
				{children}
			</Wrapper>
		</Container>,
		document.getElementById(identifier!)!,
	);
};

const Container = styled.div<{ backdrop?: boolean }>`
	position: fixed;
	top: 0; bottom: 0; left: 0; right: 0;
	display: flex;
	align-items: center;
	justify-content: center;
	background: ${p => p.theme.ui.surface}AA;

	z-index: 102;
`;

const Wrapper = styled.div`
	border: 1px solid ${p => p.theme.ui.backgroundBorderSeparator};
	border-radius: 5px;
	background: ${p => p.theme.ui.surface};
`;

export default Dialog;
