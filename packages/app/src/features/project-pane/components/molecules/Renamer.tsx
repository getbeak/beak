import { Nodes } from '@beak/common/types/beak-project';
import React, { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import styled, { css } from 'styled-components';
import validFilename from 'valid-filename';

import actions from '../../../../store/project/actions';

const errors = {
	noName: 'A name must be provided.',
	notValid: 'The name given is not valid.',
};

interface RenamerProps {
	node: Nodes;
	parentRef: React.MutableRefObject<HTMLElement | undefined>;
}

const Renamer: React.FunctionComponent<RenamerProps> = props => {
	const dispatch = useDispatch();
	const { node, parentRef } = props;

	const [editing, setEditing] = useState(false);
	const [error, setError] = useState<string | undefined>(void 0);
	const renameInputRef = useRef<HTMLInputElement>(null);
	const rename = useSelector(s => s.global.project.activeRename);

	useEffect(() => {
		if (!rename) {
			reset();

			return;
		}

		if (rename.id !== node.id) {
			reset();
			parentRef?.current?.focus();

			return;
		}

		if (editing)
			renameInputRef?.current?.select();
		else
			setEditing(true);
	}, [rename?.id, editing]);

	function reset() {
		setEditing(false);
		setError(void 0);
	}

	function updateEditValue(value: string) {
		dispatch(actions.renameUpdated({ requestId: node.id, name: value }));

		switch (true) {
			case value === '':
				setError(errors.noName);
				break;

			case !validFilename(value):
				setError(errors.notValid);
				break;

			default:
				setError(void 0);
				break;
		}
	}

	if (!editing || !rename)
		return <React.Fragment>{props.children}</React.Fragment>;

	return (
		<RenameContainer>
			<RenameInput
				ref={renameInputRef}
				type={'text'}
				value={rename.name}
				$error={Boolean(error)}
				onBlur={() => dispatch(actions.renameCancelled({ requestId: node.id }))}
				onKeyDown={e => {
					if (!['Escape', 'Enter'].includes(e.key))
						return;

					if (e.key === 'Escape')
						dispatch(actions.renameCancelled({ requestId: node.id }));

					if (e.key === 'Enter') {
						if (error !== void 0)
							return;

						dispatch(actions.renameSubmitted({ requestId: node.id }));
					}

					// Return focus to the element behind the input!
					window.setTimeout(() => parentRef.current?.focus(), 1);
				}}
				onChange={e => updateEditValue(e.currentTarget.value)}
			/>
			{error && <RenameError>{error}</RenameError>}
		</RenameContainer>
	);
};

const RenameContainer = styled.div`
	position: relative;
	flex-grow: 2;
`;

const RenameInput = styled.input<{ $error: boolean }>`
	border: 1px solid ${p => p.theme.ui.primaryFill};
	background-color: ${p => p.theme.ui.background};
	color: ${p => p.theme.ui.textOnSurfaceBackground};
	width: calc(100% - 4px);

	font-size: 13px;

	${p => p.$error && css`border-color: ${p.theme.ui.destructiveAction} !important;`}
`;

const RenameError = styled.div`
	position: absolute;
	top: 19px;
	left: 0; right: 0;
	background: ${p => p.theme.ui.background};
	border: 1px solid ${p => p.theme.ui.destructiveAction};
	border-top: none;
	color: ${p => p.theme.ui.textOnSurfaceBackground};

	padding: 4px 2px;
	font-size: 12px;
`;

export default Renamer;
