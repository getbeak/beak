import { getGlobal } from '@beak/app/globals';
import { TypedObject } from '@beak/common/dist/helpers/typescript';
import { RequestNode } from '@beak/common/types/beak-project';
import React, { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';

import actions, { requestSelected } from '../../../../store/project/actions';
import RequestStatusBlob from '../atoms/RequestStatusBlob';

export interface RequestItemProps {
	depth: number;
	id: string;
}

const RequestItem: React.FunctionComponent<RequestItemProps> = props => {
	const dispatch = useDispatch();
	const [editing, setEditing] = useState(false);
	const renameInputRef = useRef<HTMLInputElement>(null);
	const wrapperRef = useRef<HTMLDivElement>(null);

	const node = useSelector(s => s.global.project.tree![props.id]) as RequestNode;
	const rename = useSelector(s => s.global.project.activeRename);
	const selectedRequest = useSelector(s => s.global.project.selectedRequest);
	const flight = useSelector(s => s.global.flight.flightHistory[node.id]);
	const active = selectedRequest === props.id;

	let mostRecentFlight = null;

	if (flight?.history)
		mostRecentFlight = TypedObject.values(flight.history)[0]?.response?.status;

	useEffect(() => {
		if (!rename) {
			setEditing(false);

			return;
		}

		if (rename?.requestId !== node.id) {
			setEditing(false);
			wrapperRef?.current?.focus();

			return;
		}

		if (editing)
			renameInputRef?.current?.select();
		else
			setEditing(true);
	}, [rename, rename?.requestId, editing]);

	function startEditing(event: React.KeyboardEvent<HTMLDivElement>) {
		if (!active || event.key !== getRenameKey())
			return;

		dispatch(actions.requestRenameStarted({ requestId: node.id }));
	}

	return (
		<Wrapper
			active={active}
			data-tree-id={node.id}
			depth={props.depth}
			tabIndex={0}
			ref={wrapperRef}
			onClick={() => dispatch(requestSelected(props.id))}
			onKeyDown={(event: React.KeyboardEvent<HTMLDivElement>) => startEditing(event)}
			onDoubleClick={() => {
				if (editing)
					return;

				dispatch(actions.requestRenameStarted({ requestId: node.id }));
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
					value={rename.name}
					onBlur={() => {
						dispatch(actions.requestRenameCancelled({ requestId: node.id }));
					}}
					onKeyDown={e => {
						if (e.key === 'Escape')
							dispatch(actions.requestRenameCancelled({ requestId: node.id }));
						else if (e.key === 'Enter')
							dispatch(actions.requestRenameSubmitted({ requestId: node.id }));
					}}
					onChange={e => {
						dispatch(actions.requestRenameUpdated({ requestId: node.id, name: e.currentTarget.value }));
					}}
				/>
			)}

			{mostRecentFlight && <RequestStatusBlob $status={mostRecentFlight} />}
		</Wrapper>
	);
};

function getRenameKey() {
	if (getGlobal('platform') === 'darwin')
		return 'Enter';

	return 'F2';
}

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
	background-color: ${props => props.active ? props.theme.ui.surface : 'transparent'};

	&:hover {
		color: ${props => props.theme.ui.textOnSurfaceBackground};
	}
	&:focus {
		outline: none;
		background-color: ${props => props.theme.ui.secondarySurface};
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

	&:focus {
		outline: none;
	}
`;

export default RequestItem;
