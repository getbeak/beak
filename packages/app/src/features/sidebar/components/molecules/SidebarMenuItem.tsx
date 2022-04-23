import React from 'react';
import { SidebarVariant } from '@beak/common/types/beak-hub';
import { faTable, IconDefinition } from '@fortawesome/free-solid-svg-icons';
import { faFolderTree } from '@fortawesome/free-solid-svg-icons/faFolderTree';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import styled, { useTheme } from 'styled-components';

const icons: Record<SidebarVariant, IconDefinition> = {
	project: faFolderTree,
	variables: faTable,
};

interface SidebarMenuItemProps {
	item: SidebarVariant;
	selectedItem: SidebarVariant | null;
	onClick: (variant: SidebarVariant) => void;
}

const SidebarMenuItem: React.FC<React.PropsWithChildren<SidebarMenuItemProps>> = props => {
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
`;
