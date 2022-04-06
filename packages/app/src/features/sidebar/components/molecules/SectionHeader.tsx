import React from 'react';
import { showContextMenu } from '@beak/app/utils/context-menu';
import { faEllipsisV } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import type { MenuItemConstructorOptions } from 'electron';
import styled from 'styled-components';

interface SectionHeaderProps {
	actions?: MenuItemConstructorOptions[];
	onClick: () => void;
}

const SectionHeader: React.FunctionComponent<SectionHeaderProps> = props => {
	const { actions, children, onClick } = props;

	return (
		<Container onClick={onClick}>
			{children}
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

const Container = styled.div`
	display: flex;
	justify-content: space-between;
	padding: 6px 5px;

	text-transform: uppercase;
	font-size: 11px;
	font-weight: 600;

	cursor: pointer;
`;

const Actions = styled.div`
	padding: 0 6px;
	border-radius: 3px;

	&:hover {
		background: ${p => p.theme.ui.surfaceFill};
	}
`;

export default SectionHeader;
