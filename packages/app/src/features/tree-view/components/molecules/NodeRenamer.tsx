import React, { useContext, useEffect, useRef, useState } from 'react';
import styled, { css } from 'styled-components';
import validFilename from 'valid-filename';

import { TreeViewAbstractionsContext } from '../../contexts/abstractions-context';
import { useActiveRename } from '../../hooks/use-active-rename';
import { TreeViewItem } from '../../types';

const errors = {
	noName: 'A name must be provided.',
	notValid: 'The name given is not valid.',
};

interface NodeRenamerProps {
	node: TreeViewItem;
	// parentRef: React.MutableRefObject<HTMLElement | null>;
}

const NodeRenamer: React.FunctionComponent<NodeRenamerProps> = props => {
	const { node } = props;
	const absContext = useContext(TreeViewAbstractionsContext);
	const [activeRename, renaming] = useActiveRename(node);

	const [error, setError] = useState<string | undefined>(void 0);
	const renameInputRef = useRef<HTMLInputElement>(null);

	useEffect(() => renameInputRef.current?.focus(), [activeRename?.id]);

	if (!renaming)
		return <React.Fragment>{node.name}</React.Fragment>;

	function updateEditValue(value: string) {
		absContext.onRenameUpdated?.(node, value);

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

	return (
		<Renamer>
			<RenameInput
				ref={renameInputRef}
				type={'text'}
				value={activeRename!.name}
				$error={Boolean(error)}
				onBlur={() => absContext.onRenameEnded?.(node)}
				onKeyDown={e => {
					if (!['Escape', 'Enter'].includes(e.key))
						return;

					if (e.key === 'Escape')
						absContext.onRenameEnded?.(node);

					if (e.key === 'Enter') {
						if (error !== void 0)
							return;

						absContext.onRenameSubmitted?.(node);
					}

					// // Return focus to the element behind the input!
					// window.setTimeout(() => parentRef.current?.focus(), 1);
				}}
				onChange={e => updateEditValue(e.currentTarget.value)}
			/>
			{error && <RenameError>{error}</RenameError>}
		</Renamer>
	);
};

const Renamer = styled.div`
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

export default NodeRenamer;
