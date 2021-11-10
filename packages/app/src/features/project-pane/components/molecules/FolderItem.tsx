import { toVibrancyAlpha } from '@beak/app/design-system/utils';
import { checkShortcut } from '@beak/app/lib/keyboard-shortcuts';
import { TypedObject } from '@beak/common/helpers/typescript';
import { FolderNode } from '@beak/common/types/beak-project';
import React, { useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';

import actions from '../../../../store/project/actions';
import ContextMenuWrapper from '../atoms/ContextMenuWrapper';
import Renamer from './Renamer';
import Switch from './Switch';

export interface FolderItemProps {
	depth: number;
	id: string;
}

const FolderItem: React.FunctionComponent<FolderItemProps> = props => {
	const dispatch = useDispatch();
	const { depth } = props;
	const [expanded, setExpanded] = useState(true);
	const element = useRef<HTMLDivElement>();
	const [target, setTarget] = useState<HTMLElement>();

	const rename = useSelector(s => s.global.project.activeRename);
	const node = useSelector(s => s.global.project.tree![props.id]) as FolderNode;
	const nodes = useSelector(s => s.global.project.tree!);
	const childNodes = TypedObject.values(nodes)
		.filter(n => n.parent === node.filePath)
		.sort((a, b) => a.name.localeCompare(b.name, void 0, {
			numeric: true,
			sensitivity: 'base',
		}));

	return (
		<ContextMenuWrapper mode={'folder'} nodeId={node.filePath} target={target}>
			<Wrapper
				depth={depth}
				ref={(i: HTMLDivElement) => {
					element.current = i;
					setTarget(i);
				}}
				tabIndex={0}
				onKeyDown={event => {
					if (rename?.id === node.id)
						return;

					switch (true) {
						case checkShortcut('project-explorer.folder.left', event):
							if (expanded)
								setExpanded(false);
							else if (element.current)
								element.current.parentElement?.focus();

							break;

						case checkShortcut('project-explorer.folder.right', event):
							if (!expanded)
								setExpanded(true);
							else if (element.current?.nextElementSibling)
								(element.current.nextElementSibling as HTMLElement).focus();

							break;

						case checkShortcut('project-explorer.folder.up', event):
							if (element.current?.previousElementSibling)
								(element.current.previousElementSibling as HTMLElement).focus();

							break;

						case checkShortcut('project-explorer.folder.down', event):
							if (element.current?.nextElementSibling)
								(element.current.nextElementSibling as HTMLElement).focus();

							break;

						case checkShortcut('project-explorer.folder.rename', event):
							dispatch(actions.renameStarted({ requestId: node.id, type: 'folder' }));

							break;

						default:
							return;
					}

					event.preventDefault();
				}}
				onClick={() => setExpanded(!expanded)}
			>
				<Chevron expanded={expanded} />
				<Renamer node={node} parentRef={element}>
					{node.name}
				</Renamer>
			</Wrapper>

			{expanded && childNodes.filter(n => n.type === 'folder').map(n => (
				<Switch
					depth={depth + 1}
					key={n.filePath}
					id={n.filePath}
					parentNode={element.current!}
				/>
			))}

			{expanded && childNodes.filter(n => n.type === 'request').map(n => (
				<Switch
					depth={depth + 1}
					key={n.id}
					id={n.id}
					parentNode={element.current!}
				/>
			))}
		</ContextMenuWrapper>
	);
};

const Wrapper = styled.div<{ depth: number }>`
	display: flex;
	padding: 3px 0;
	padding-left: ${props => (props.depth * 8) + 21}px;
	color: ${props => props.theme.ui.textMinor};
	cursor: pointer;
	font-size: 13px;
	line-height: 18px;

	&:hover {
		color: ${props => props.theme.ui.textOnSurfaceBackground};
	}
	&:focus {
		outline: none;
		background-color: ${props => toVibrancyAlpha(props.theme.ui.secondarySurface, 0.7)};
	}
`;

const Chevron = styled.div<{ expanded: boolean }>`
	display: inline-block;
	border-right: 1px solid ${props => props.theme.ui.textOnSurfaceBackground};
	border-bottom: 1px solid ${props => props.theme.ui.textOnSurfaceBackground};
	width: 5px;
	height: 5px;
	margin-top: 6px;
	margin-right: 5px;
	margin-left: -5px;
	transform: rotate(${props => props.expanded ? '45deg' : '-45deg'});
	transform-origin: 50%;

	margin-bottom: ${props => props.expanded ? '2px' : '1px'};
`;

export default FolderItem;
