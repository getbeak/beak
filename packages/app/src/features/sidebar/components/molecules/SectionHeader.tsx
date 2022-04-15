import React from 'react';
import { showContextMenu } from '@beak/app/utils/context-menu';
import { faChevronRight, faEllipsisV } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import type { MenuItemConstructorOptions } from 'electron';
import styled from 'styled-components';

interface SectionHeaderProps {
	actions?: MenuItemConstructorOptions[];
	collapsed?: boolean;
	disableCollapse?: boolean;
	onClick: () => void;
}

const SectionHeader: React.FunctionComponent<SectionHeaderProps> = props => {
	const { actions, children, collapsed, disableCollapse, onClick } = props;

	return (
		<Container onClick={onClick} $disableCollapse={disableCollapse}>
			<Header>
				<CollapsedIndicator $collapsed={collapsed}>
					<FontAwesomeIcon icon={faChevronRight} />
				</CollapsedIndicator>

				{children}
			</Header>
			{actions && actions.length > 0 && (
				<Actions onClick={event => {
					event.preventDefault();
					event.stopPropagation();

					showContextMenu('test', actions);
				}}>
					<FontAwesomeIcon
						icon={faEllipsisV}
						fontSize={'10px'}
					/>
				</Actions>
			)}
		</Container>
	);
};

const Container = styled.div<{ $disableCollapse?: boolean }>`
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 6px 5px;

	text-transform: uppercase;
	font-size: 11px;
	font-weight: 600;

	cursor: ${p => p.$disableCollapse ? 'default' : 'pointer'};
`;

const Header = styled.div`
	text-overflow: ellipsis;
	white-space: nowrap;
	overflow: hidden;
`;

const CollapsedIndicator = styled.div<{ $collapsed?: boolean }>`
	display: inline-block;
	margin-right: 3px;
	padding-left: 2px;
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

const Actions = styled.div`
	padding: 0 6px;
	border-radius: 3px;

	&:hover {
		background: ${p => p.theme.ui.surfaceFill};
	}
`;

export default SectionHeader;
