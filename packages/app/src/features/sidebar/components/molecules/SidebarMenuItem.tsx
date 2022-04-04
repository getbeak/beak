import React from 'react';
import { IconDefinition } from '@fortawesome/free-solid-svg-icons';
import { faFolderTree } from '@fortawesome/free-solid-svg-icons/faFolderTree';
import { faKeyboard } from '@fortawesome/free-solid-svg-icons/faKeyboard';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import styled, { css, useTheme } from 'styled-components';

export type SidebarVariant = 'project' | 'variables';

const icons: Record<SidebarVariant, IconDefinition> = {
	project: faFolderTree,
	variables: faKeyboard,
};

interface SidebarMenuItemProps {
	item: SidebarVariant;
	selectedItem: SidebarVariant | null;
	onClick: (variant: SidebarVariant) => void;
}

const SidebarMenuItem: React.FunctionComponent<SidebarMenuItemProps> = props => {
	const theme = useTheme();
	const { item, selectedItem, onClick } = props;
	const active = item === selectedItem;

	return (
		<Container
			$active={active}
			onClick={() => onClick(item)}
		>
			<FontAwesomeIcon
				icon={icons[item]}
				color={theme.ui.blankFill}
				fontSize={'14px'}
			/>
		</Container>
	);
};

export default SidebarMenuItem;

const Container = styled.div<{ $active?: boolean }>`
	display: flex;
	align-items: center;
	justify-content: center;

	cursor: pointer;
	height: 40px;
	border-left: 1px solid transparent;

	${p => p.$active && css`
		border-color: ${p => p.theme.ui.primaryFill};
	`}
`;
