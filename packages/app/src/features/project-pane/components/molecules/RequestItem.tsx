import React, { useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toVibrancyAlpha } from '@beak/app/design-system/utils';
import { changeTab, makeTabPermanent } from '@beak/app/features/tabs/store/actions';
import { checkShortcut } from '@beak/app/lib/keyboard-shortcuts';
import { TypedObject } from '@beak/common/helpers/typescript';
import { ValidRequestNode } from '@beak/common/types/beak-project';
import styled from 'styled-components';

import actions from '../../../../store/project/actions';
import ContextMenuWrapper from '../atoms/ContextMenuWrapper';
import RequestStatusBlob from '../atoms/RequestStatusBlob';
import Renamer from './Renamer';

export interface RequestItemProps {
	depth: number;
	id: string;
	parentNode: null | HTMLElement;
}

const RequestItem: React.FunctionComponent<RequestItemProps> = props => {
	const dispatch = useDispatch();
	const wrapperRef = useRef<HTMLDivElement | null>(null);
	const [target, setTarget] = useState<HTMLElement>();

	const rename = useSelector(s => s.global.project.activeRename);
	const node = useSelector(s => s.global.project.tree![props.id]) as ValidRequestNode;
	const selectedTabPayload = useSelector(s => s.features.tabs.selectedTab);
	const flight = useSelector(s => s.global.flight.flightHistory[node.id]);
	const active = selectedTabPayload === props.id;

	let mostRecentFlight = null;

	if (flight?.history) {
		const flightHistory = TypedObject.values(flight.history);
		const lastIndex = flightHistory.length - 1;

		if (lastIndex > -1)
			mostRecentFlight = flightHistory[lastIndex]?.response?.status;
	}

	return (
		<ContextMenuWrapper mode={'request'} nodeId={props.id} target={target}>
			<Wrapper
				active={active}
				depth={props.depth}
				ref={i => {
					wrapperRef.current = i;

					setTarget(i!);
				}}
				tabIndex={0}
				onClick={() => dispatch(changeTab({
					type: 'request',
					temporary: true,
					payload: node.id,
				}))}
				onDoubleClick={() => dispatch(makeTabPermanent(node.id))}
				onKeyDown={(event: React.KeyboardEvent<HTMLDivElement>) => {
					if (rename?.id === node.id)
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
							dispatch(changeTab({
								type: 'request',
								temporary: true,
								payload: node.id,
							}));

							break;

						case checkShortcut('project-explorer.request.rename', event):
							dispatch(actions.renameStarted({ requestId: node.id, type: 'request' }));

							break;

						default:
							return;
					}

					event.preventDefault();
				}}
			>
				<Renamer node={node} parentRef={wrapperRef}>
					<Name title={node.name}>
						{node.name}
					</Name>
				</Renamer>

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
	padding-left: ${props => (props.depth * 8) + 7}px;
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

export default RequestItem;
