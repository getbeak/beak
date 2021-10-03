import { toVibrancyAlpha } from '@beak/app/design-system/utils';
import { checkShortcut } from '@beak/app/lib/keyboard-shortcuts';
import { TypedObject } from '@beak/common/helpers/typescript';
import { RequestNode } from '@beak/common/types/beak-project';
import React, { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import styled, { css } from 'styled-components';
import validFilename from 'valid-filename';

import actions from '../../../../store/project/actions';
import ContextMenuWrapper from '../atoms/ContextMenuWrapper';
import RequestStatusBlob from '../atoms/RequestStatusBlob';

const errors = {
	noName: 'A request name must be provided.',
	notValid: 'The request name given is not valid.',
};

export interface RequestItemProps {
	depth: number;
	id: string;
	parentNode: null | HTMLElement;
}

const RequestItem: React.FunctionComponent<RequestItemProps> = props => {
	const dispatch = useDispatch();
	const [editing, setEditing] = useState(false);
	const [error, setError] = useState<string | undefined>(void 0);
	const renameInputRef = useRef<HTMLInputElement>(null);
	const wrapperRef = useRef<HTMLDivElement>();
	const [target, setTarget] = useState<HTMLElement>();

	const node = useSelector(s => s.global.project.tree![props.id]) as RequestNode;
	const rename = useSelector(s => s.global.project.activeRename);
	const selectedTabPayload = useSelector(s => s.global.project.selectedTabPayload);
	const flight = useSelector(s => s.global.flight.flightHistory[node.id]);
	const active = selectedTabPayload === props.id;

	let mostRecentFlight = null;

	if (flight?.history) {
		const flightHistory = TypedObject.values(flight.history);
		const lastIndex = flightHistory.length - 1;

		if (lastIndex > -1)
			mostRecentFlight = flightHistory[lastIndex]?.response?.status;
	}

	useEffect(() => {
		if (!rename) {
			reset();

			return;
		}

		if (rename.requestId !== node.id) {
			reset();
			wrapperRef?.current?.focus();

			return;
		}

		if (editing)
			renameInputRef?.current?.select();
		else
			setEditing(true);
	}, [rename?.requestId, editing]);

	function reset() {
		setEditing(false);
		setError(void 0);
	}

	function updateEditValue(value: string) {
		dispatch(actions.requestRenameUpdated({ requestId: node.id, name: value }));

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
		<ContextMenuWrapper mode={'request'} nodeId={props.id} target={target}>
			<Wrapper
				active={active}
				depth={props.depth}
				ref={(i: HTMLDivElement) => {
					wrapperRef.current = i;

					setTarget(i);
				}}
				tabIndex={0}
				onClick={() => dispatch(actions.tabSelected({
					type: 'request',
					temporary: true,
					payload: node.id,
				}))}
				onDoubleClick={() => dispatch(actions.setTabAsPermanent(node.id))}
				onKeyDown={(event: React.KeyboardEvent<HTMLDivElement>) => {
					if (editing)
						return;

					switch (true) {
						case checkShortcut('project-explorer.request.left', event):
							if (props.parentNode)
								props.parentNode.focus();

							break;

						case checkShortcut('project-explorer.request.up', event):
							if (wrapperRef.current?.previousElementSibling)
								(wrapperRef.current.previousElementSibling as HTMLElement).focus();

							break;

						case checkShortcut('project-explorer.request.down', event):
							if (wrapperRef.current?.nextElementSibling)
								(wrapperRef.current.nextElementSibling as HTMLElement).focus();

							break;

						case checkShortcut('project-explorer.request.open', event):
							dispatch(actions.tabSelected({
								type: 'request',
								temporary: true,
								payload: node.id,
							}));

							break;

						case checkShortcut('project-explorer.request.rename', event):
							dispatch(actions.requestRenameStarted({ requestId: node.id }));

							break;

						default:
							return;
					}

					event.preventDefault();
				}}
			>
				{!editing && (
					<Name title={node.name}>
						{node.name}
					</Name>
				)}
				{editing && rename && (
					<RenameContainer>
						<RenameInput
							ref={renameInputRef}
							type={'text'}
							value={rename.name}
							$error={Boolean(error)}
							onBlur={() => dispatch(actions.requestRenameCancelled({ requestId: node.id }))}
							onKeyDown={e => {
								if (!['Escape', 'Enter'].includes(e.key))
									return;

								if (e.key === 'Escape')
									dispatch(actions.requestRenameCancelled({ requestId: node.id }));

								if (e.key === 'Enter') {
									if (error !== void 0)
										return;

									dispatch(actions.requestRenameSubmitted({ requestId: node.id }));
								}

								// Return focus to the element behind the input!
								window.setTimeout(() => wrapperRef.current?.focus(), 1);
							}}
							onChange={e => updateEditValue(e.currentTarget.value)}
						/>
						{error && <RenameError>{error}</RenameError>}
					</RenameContainer>
				)}

				{mostRecentFlight && <RequestStatusBlob $status={mostRecentFlight} />}
			</Wrapper>
		</ContextMenuWrapper>
	);
};

interface WrapperProps {
	active: boolean;
	depth: number;
}

const Wrapper = styled.div<WrapperProps>`
	display: flex;
	padding: 4px 0;
	padding-left: ${props => (props.depth * 8) + 19}px;
	cursor: pointer;
	font-size: 13px;
	line-height: 18px;

	color: ${props => props.theme.ui.textMinor};
	background-color: ${props => props.active ? toVibrancyAlpha(props.theme.ui.surface, 0.7) : 'transparent'};

	&:hover {
		color: ${props => props.theme.ui.textOnSurfaceBackground};
	}
	&:focus {
		outline: none;
		background-color: ${props => toVibrancyAlpha(props.theme.ui.secondarySurface, 0.7)};
	}
`;

const Name = styled.abbr`
	flex-grow: 2;

	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
	text-decoration: none;
`;

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

	box-shadow: none !important;
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

export default RequestItem;
