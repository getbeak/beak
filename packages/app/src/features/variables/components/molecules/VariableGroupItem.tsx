import React, { useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toVibrancyAlpha } from '@beak/app/design-system/utils';
import { changeTab, makeTabPermanent } from '@beak/app/features/tabs/store/actions';
import { checkShortcut } from '@beak/app/lib/keyboard-shortcuts';
import { actions } from '@beak/app/store/variable-groups';
import styled from 'styled-components';

import ContextMenuWrapper from '../atoms/ContextMenuWrapper';
import Renamer from './Renamer';

interface VariableGroupItemProps {
	variableGroupName: string;
}

const VariableGroupItem: React.FunctionComponent<VariableGroupItemProps> = props => {
	const { variableGroupName } = props;
	const dispatch = useDispatch();
	const wrapperRef = useRef<HTMLDivElement | null>(null);
	const [target, setTarget] = useState<HTMLElement>();

	const rename = useSelector(s => s.global.variableGroups.activeRename);
	const selectedTabPayload = useSelector(s => s.features.tabs.selectedTab);
	const active = selectedTabPayload === variableGroupName;

	return (
		<ContextMenuWrapper variableGroupName={variableGroupName} target={target}>
			<Wrapper
				$active={active}
				ref={i => {
					wrapperRef.current = i;

					setTarget(i!);
				}}
				tabIndex={0}
				onClick={() => dispatch(changeTab({
					type: 'variable_group_editor',
					temporary: true,
					payload: variableGroupName,
				}))}
				onDoubleClick={() => dispatch(makeTabPermanent(variableGroupName))}
				onKeyDown={(event: React.KeyboardEvent<HTMLDivElement>) => {
					if (rename?.variableGroupName === variableGroupName)
						return;

					switch (true) {
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
								type: 'variable_group_editor',
								temporary: true,
								payload: variableGroupName,
							}));

							break;

						case checkShortcut('project-explorer.request.rename', event):
							dispatch(actions.renameStarted({ variableGroupName }));

							break;

						default:
							return;
					}

					event.preventDefault();
				}}
			>
				<Renamer variableGroupName={variableGroupName} parentRef={wrapperRef}>
					<Name title={variableGroupName}>
						{variableGroupName}
					</Name>
				</Renamer>
			</Wrapper>
		</ContextMenuWrapper>
	);
};

interface WrapperProps {
	$active: boolean;
}

const Wrapper = styled.div<WrapperProps>`
	display: flex;
	padding: 4px 0;
	padding-left: 5px;
	cursor: pointer;
	font-size: 13px;
	line-height: 18px;

	color: ${props => props.theme.ui.textMinor};
	background-color: ${props => props.$active ? toVibrancyAlpha(props.theme.ui.surface, 0.7) : 'transparent'};

	&:hover {
		color: ${props => props.theme.ui.textOnSurfaceBackground};
	}
	&:focus {
		outline: none;
		background-color: ${props => toVibrancyAlpha(props.theme.ui.secondarySurface, 0.7)};
	}
	
	&:first-of-type {
		margin-top: 2px;
	}
`;

const Name = styled.abbr`
	flex-grow: 2;

	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
	text-decoration: none;
`;

export default VariableGroupItem;
