import React from 'react';
import { SidebarVariant } from '@beak/common/types/beak-hub';
import { Shortcuts } from '@beak/ui/lib/keyboard-shortcuts';
import { renderPlainTextDefinition } from '@beak/ui/utils/keyboard-rendering';
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
	name: string;
	selectedItem: SidebarVariant | null;
	shortcut: Shortcuts;
	onClick: (variant: SidebarVariant) => void;
}

const SidebarMenuItem: React.FC<React.PropsWithChildren<SidebarMenuItemProps>> = props => {
	const theme = useTheme();
	const { item, name, selectedItem, shortcut, onClick } = props;
	const active = item === selectedItem;

	return (
		<FakeAbbr
			data-tooltip-id={'tt-sidebar-menu-item'}
			data-tooltip-content={`${name} (${renderPlainTextDefinition(shortcut)})`}
		>
			<Container
				$active={active}
				onClick={() => onClick(item)}
			>
				<FontAwesomeIcon
					icon={icons[item]}
					color={theme.ui.textOnSurfaceBackground}
					fontSize={'14px'}
				/>
			</Container>
		</FakeAbbr>
	);
};

export default SidebarMenuItem;

const FakeAbbr = styled.div`
	text-decoration: underline;
	text-decoration-style: dotted;
`;

const Container = styled.div<{ $active?: boolean }>`
	display: flex;
	align-items: center;
	justify-content: center;

	cursor: pointer;
	height: 40px;
`;
