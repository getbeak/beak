import React, { useContext, useEffect, useRef, useState } from 'react';
import styled, { css } from 'styled-components';
import validFilename from 'valid-filename';

import { TreeViewAbstractionsContext } from '../../contexts/abstractions-context';
import { TreeViewFocusContext } from '../../contexts/focus-context';
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

const NodeRenamer: React.FC<React.PropsWithChildren<NodeRenamerProps>> = props => {
	const { node } = props;
	const absContext = useContext(TreeViewAbstractionsContext);
	const focusContext = useContext(TreeViewFocusContext);
	const [activeRename, renaming] = useActiveRename(node);

	const [canShowTooltip, setCanShowTooltip] = useState(false);
	const [error, setError] = useState<string | undefined>(void 0);
	const renameInputRef = useRef<HTMLInputElement>(null);
	const wrappedTextRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		renameInputRef.current?.focus();
		renameInputRef.current?.select();
	}, [activeRename?.id]);

	useEffect(() => {
		if (activeRename || !wrappedTextRef.current)
			return;

		const element = wrappedTextRef.current;
		const textOverflowed = element.scrollWidth > element.clientWidth || element.scrollHeight > element.clientHeight;

		const resizeObserver = new ResizeObserver(() => {
			if (textOverflowed) {
				setCanShowTooltip(true);
			} else {
				setCanShowTooltip(false);
			}
		});
	
		resizeObserver.observe(element);
	
		return () => {
			resizeObserver.disconnect();
			setCanShowTooltip(false);
		};
	}, [activeRename]);

	if (!renaming) {
		return (
			<RenameWrappedText
				data-tooltip-id={'tt-realtime-values-renderer-extension-missing'}
				data-tooltip-content={node.name}
				data-tooltip-place={'top-end'}
				data-tooltip-hidden={!canShowTooltip}
				ref={wrappedTextRef}
			>
				{node.name}
			</RenameWrappedText>
		);
	}

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

					// Return focus to the element behind the input!
					focusContext.setFocusedNodeId(node.id);
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
	text-overflow: ellipsis;
`;

const RenameWrappedText = styled.div`
	overflow: hidden;
	white-space: nowrap;
	text-overflow: ellipsis;
`;

const RenameInput = styled.input<{ $error: boolean }>`
	border: 1px solid ${p => p.theme.ui.primaryFill};
	background-color: ${p => p.theme.ui.background};
	color: ${p => p.theme.ui.textOnSurfaceBackground};
	width: calc(100% - 4px);

	font-size: 12px;
	line-height: 15px;

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
