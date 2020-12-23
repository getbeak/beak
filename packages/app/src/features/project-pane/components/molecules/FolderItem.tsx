import { toVibrancyAlpha } from '@beak/app/design-system/utils';
import { checkShortcut } from '@beak/app/lib/keyboard-shortcuts';
import { TypedObject } from '@beak/common/helpers/typescript';
import { FolderNode } from '@beak/common/types/beak-project';
import React, { useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import ContextMenuWrapper from '../atoms/ContextMenuWrapper';
import Switch from './Switch';

export interface FolderItemProps {
	depth: number;
	id: string;
}

const FolderItem: React.FunctionComponent<FolderItemProps> = props => {
	const { depth } = props;
	const [expanded, setExpanded] = useState(true);
	const element = useRef<HTMLDivElement>();
	const [target, setTarget] = useState<HTMLElement>();
	const node = useSelector(s => s.global.project.tree![props.id]) as FolderNode;
	const nodes = useSelector(s => s.global.project.tree!);
	const childNodes = TypedObject.values(nodes).filter(n => n.parent === node.filePath);

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

						default:
							break;
					}
				}}
				onClick={() => setExpanded(!expanded)}
			>
				<Chevron expanded={expanded} />
				{node.name}
			</Wrapper>

			{expanded && childNodes.map(n => {
				const id = n.type === 'folder' ? n.filePath : n.id;

				return (
					<Switch
						depth={depth + 1}
						key={id}
						id={id} parentNode={element.current!}
					/>
				);
			})}
		</ContextMenuWrapper>
	);
};

const Wrapper = styled.div<{ depth: number }>`
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
	margin-right: 5px;
	margin-left: -5px;
	transform: rotate(${props => props.expanded ? '45deg' : '-45deg'});
	transform-origin: 50%;

	margin-bottom: ${props => props.expanded ? '2px' : '1px'};
`;

export default FolderItem;
