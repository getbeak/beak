import { toVibrancyAlpha } from '@beak/app/design-system/utils';
import { checkShortcut } from '@beak/app/lib/keyboard-shortcuts';
import { TypedObject } from '@beak/common/dist/helpers/typescript';
import { RequestNode } from '@beak/common/types/beak-project';
import React, { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';

import actions from '../../../../store/project/actions';
import ContextMenuWrapper from '../atoms/ContextMenuWrapper';
import RequestStatusBlob from '../atoms/RequestStatusBlob';

export interface RequestItemProps {
	depth: number;
	id: string;
	parentNode: null | HTMLElement;
}

const RequestItem: React.FunctionComponent<RequestItemProps> = props => {
	const dispatch = useDispatch();
	const [editing, setEditing] = useState(false);
	const renameInputRef = useRef<HTMLInputElement>(null);
	const wrapperRef = useRef<HTMLDivElement>();
	const [target, setTarget] = useState<HTMLElement>();

	const node = useSelector(s => s.global.project.tree![props.id]) as RequestNode;
	const rename = useSelector(s => s.global.project.activeRename);
	const selectedTabPayload = useSelector(s => s.global.project.selectedTabPayload);
	const flight = useSelector(s => s.global.flight.flightHistory[node.id]);
	const active = selectedTabPayload === props.id;

	let mostRecentFlight = null;

	if (flight?.history)
		mostRecentFlight = TypedObject.values(flight.history)[0]?.response?.status;

	useEffect(() => {
		if (!rename) {
			setEditing(false);

			return;
		}

		if (rename.requestId !== node.id) {
			setEditing(false);
			wrapperRef?.current?.focus();

			return;
		}

		if (editing)
			renameInputRef?.current?.select();
		else
			setEditing(true);
	}, [rename?.requestId, editing]);

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
							break;
					}
				}}
			>
				{!editing && (
					<Name title={node.name}>
						{node.name}
					</Name>
				)}
				{editing && rename && (
					<RenameInput
						ref={renameInputRef}
						type={'text'}
						value={rename.name}
						onBlur={() => {
							dispatch(actions.requestRenameCancelled({ requestId: node.id }));
						}}
						onKeyDown={e => {
							if (!['Escape', 'Enter'].includes(e.key))
								return;


							if (e.key === 'Escape')
								dispatch(actions.requestRenameCancelled({ requestId: node.id }));
							else if (e.key === 'Enter') // TODO(afr): Validation here
								dispatch(actions.requestRenameSubmitted({ requestId: node.id }));

							// Return focus to the element behind the input!
							window.setTimeout(() => wrapperRef.current?.focus(), 1);
						}}
						onChange={e => {
							dispatch(actions.requestRenameUpdated({ requestId: node.id, name: e.currentTarget.value }));
						}}
					/>
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

const RenameInput = styled.input`
	border: 1px solid ${p => p.theme.ui.primaryFill};
	border-right: 0;
	background-color: ${p => p.theme.ui.background};
	color: ${p => p.theme.ui.textOnSurfaceBackground};
	width: calc(100% - 4px);

	font-size: 13px;
`;

export default RequestItem;
