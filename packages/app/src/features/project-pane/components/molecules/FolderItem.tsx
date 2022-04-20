import React, { useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toVibrancyAlpha } from '@beak/app/design-system/utils';
import { checkShortcut } from '@beak/app/lib/keyboard-shortcuts';
import { projectPanePreferenceSetCollapse } from '@beak/app/store/preferences/actions';
import { TypedObject } from '@beak/common/helpers/typescript';
import { FolderNode } from '@beak/common/types/beak-project';
import { faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import styled, { css } from 'styled-components';

import actions from '../../../../store/project/actions';
import { useNodeDrag, useNodeDrop } from '../../hooks/node-drag-drop';
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
	const collapsed = useSelector(s => s.global.preferences.projectPane.collapsed[props.id]);
	const element = useRef<HTMLDivElement | null>(null);
	const [target, setTarget] = useState<HTMLDivElement>();

	const rename = useSelector(s => s.global.project.activeRename);
	const node = useSelector(s => s.global.project.tree![props.id]) as FolderNode;
	const nodes = useSelector(s => s.global.project.tree!);
	const childNodes = TypedObject.values(nodes)
		.filter(n => n.parent === node.filePath)
		.sort((a, b) => a.name.localeCompare(b.name, void 0, {
			numeric: true,
			sensitivity: 'base',
		}));

	const [, drag] = useNodeDrag(node);
	const [{ hovering, canDrop }, dropRef] = useNodeDrop(node);

	drag(dropRef(element));

	return (
		<ContextMenuWrapper mode={'folder'} nodeId={node.filePath} target={target}>
			<Wrapper
				$depth={depth}
				$canDrop={canDrop}
				$hovering={hovering}
				ref={i => {
					element.current = i!;
					setTarget(i!);
				}}
				tabIndex={0}
				onKeyDown={event => {
					if (rename?.id === node.id)
						return;

					switch (true) {
						case checkShortcut('project-explorer.folder.left', event):
							if (!collapsed)
								dispatch(projectPanePreferenceSetCollapse({ key: props.id, collapsed: true }));
							else if (element.current)
								element.current.parentElement?.parentElement?.focus();

							break;

						case checkShortcut('project-explorer.folder.right', event):
							if (collapsed)
								dispatch(projectPanePreferenceSetCollapse({ key: props.id, collapsed: false }));
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

						case checkShortcut('project-explorer.folder.delete', event):
							dispatch(actions.removeNodeFromDisk({ requestId: node.id, withConfirmation: true }));

							break;

						default:
							return;
					}

					event.preventDefault();
				}}
				onClick={() => {
					dispatch(projectPanePreferenceSetCollapse({ key: props.id, collapsed: !collapsed }));
				}}
			>
				<Chevron $collapsed={collapsed}>
					<FontAwesomeIcon icon={faChevronRight} />
				</Chevron>
				<Renamer node={node} parentRef={element}>
					{node.name}
				</Renamer>
			</Wrapper>

			<DropWrapper $canDrop={canDrop} $hovering={hovering} $depth={depth}>
				{!collapsed && childNodes.filter(n => n.type === 'folder').map(n => (
					<Switch
						depth={depth + 1}
						key={n.filePath}
						id={n.filePath}
						parentNode={element.current!}
					/>
				))}

				{!collapsed && childNodes.filter(n => n.type === 'request').map(n => (
					<Switch
						depth={depth + 1}
						key={n.id}
						id={n.id}
						parentNode={element.current!}
					/>
				))}
			</DropWrapper>
		</ContextMenuWrapper>
	);
};

interface DropWrapperProps {
	$hovering: boolean;
	$canDrop: boolean;
	$depth: number;
}

const DropWrapper = styled.div<DropWrapperProps>`
	${p => p.$hovering && p.$canDrop && css`
		outline: none;
		background-color: pink;
	`}
`;

const Wrapper = styled(DropWrapper)`
	display: flex;
	padding: 3px 0;
	padding-left: ${p => (p.$depth * 8) + 7}px;
	color: ${p => p.theme.ui.textMinor};
	align-items: center;
	cursor: pointer;
	font-size: 13px;
	line-height: 18px;
	border-top-left-radius: 4px;
	border-bottom-left-radius: 4px;

	&:hover {
		color: ${p => p.theme.ui.textOnSurfaceBackground};
	}
	&:focus {
		outline: none;
		background-color: ${p => toVibrancyAlpha(p.theme.ui.secondarySurface, 0.8)};
	}
`;

const Chevron = styled.div<{ $collapsed: boolean }>`
	display: inline-block;
	margin-right: 2px;
	width: 10px;

	font-size: 9px;
	line-height: 9px;
	color: ${p => p.theme.ui.textMinor};

	> svg {
		transition: transform .2s ease;
		transform-origin: center center;
		transform: rotate(${p => p.$collapsed ? '0deg' : '90deg'});
	}
`;

export default FolderItem;
