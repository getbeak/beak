import { toVibrancyAlpha } from '@beak/app/design-system/utils';
import { FolderNode } from '@beak/common/types/beak-project';
import React, { useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import Switch from './Switch';

export interface FolderItemProps {
	depth: number;
	id: string;
}

const FolderItem: React.FunctionComponent<FolderItemProps> = props => {
	const { depth } = props;
	const [expanded, setExpanded] = useState(true);
	const element = useRef<HTMLDivElement>(null);
	const node = useSelector(s => s.global.project.tree![props.id]) as FolderNode;

	return (
		<React.Fragment>
			<Wrapper
				data-tree-id={node.filePath}
				depth={depth}
				ref={element}
				tabIndex={0}
				onKeyDown={event => {
					if (event.ctrlKey || event.altKey || event.metaKey)
						return;

					switch (event.key) {
						case 'ArrowLeft':
							if (expanded)
								setExpanded(false);
							else if (element.current)
								element.current.parentElement?.focus();

							break;

						case 'ArrowRight':
							if (!expanded)
								setExpanded(true);
							else if (element.current?.nextElementSibling)
								(element.current.nextElementSibling as HTMLElement).focus();

							break;

						case 'ArrowUp':
							if (element.current?.previousElementSibling)
								(element.current.previousElementSibling as HTMLElement).focus();

							break;

						case 'ArrowDown':
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

			{expanded && node.children.map(i => <Switch depth={depth + 1} key={i} id={i} />)}
		</React.Fragment>
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
